import { eq } from "drizzle-orm";
import db from "..";
import box from "../schema/box";

// When scanning QR code, verify access
async function verifyBoxAccess(token: string, userId?: string) {
  const BOX = await db.query.box.findFirst({
    where: eq(box.accessToken, token),
    with: {
      room: {
        with: {
          project: {
            with: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!BOX) throw new Error("Box not found");

  // Allow access if:
  // 1. Box is marked as public, OR
  // 2. User is logged in and owns the project
  if (!BOX.isPublic && (!userId || BOX.room.project.userId !== userId)) {
    throw new Error("Unauthorized");
  }

  return box;
}

export default verifyBoxAccess;
