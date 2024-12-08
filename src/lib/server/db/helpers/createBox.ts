import { eq } from "drizzle-orm";
import db from "..";
import box, { type Box } from "../schema/box";
import room from "../schema/room";
import generateBoxToken from "./generateBoxToken";

// When creating a new box
async function createBox(data: Box, userId: string) {
  // Optionally verify ownership
  const ROOM = await db.query.room.findFirst({
    where: eq(room.id, data.roomId),
    with: {
      project: {
        with: {
          user: true,
        },
      },
    },
  });

  if (!ROOM || ROOM.project.user.id !== userId) {
    throw new Error("Unauthorized");
  }

  const accessToken = await generateBoxToken(data.id, userId);

  return db.insert(box).values({
    ...data,
    accessToken,
  });
}

export default createBox;
