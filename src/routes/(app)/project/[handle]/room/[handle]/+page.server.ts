// src/routes/project/[handle]/room/[handle]/+page.server.ts
import {
  error,
  fail,
  redirect,
  type Actions,
  type Redirect,
} from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import db from "@db";
import { box, item, project, room } from "@db/schema";
import { and, eq } from "drizzle-orm";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import boxSchema from "@routes/settings/zod/boxSchema";
import QRCode from "qrcode";

export const load: PageServerLoad = async ({ locals, url, params }) => {
  if (!locals.user) {
    throw redirect(302, "/login");
  }

  // console.log(url);

  const urlPathname = url.pathname; // "/project/the-big-move"
  const pathSegments = urlPathname.split("/");
  const projectHandle = pathSegments[2]; // "the-big-move"
  console.log("urlPathname", urlPathname);
  console.log("pathSegments", pathSegments);
  console.log("projectHandle", projectHandle);

  const PROJECT = await db.query.project.findFirst({
    where: and(
      eq(project.handle, projectHandle),
      eq(project.userId, locals.user.id),
    ),
    with: {
      rooms: {
        with: {
          boxes: true,
        },
      },
    },
  });

  console.log("Raw PROJECT query result:", PROJECT);
  // // console.log("ROOM boxes length:", ROOM?.boxes?.length);
  // // console.log("First box details:", ROOM?.boxes?.[0]);

  if (!PROJECT) {
    throw redirect(302, "/dashboard"); // or handle the "room not found" case
  }

  return {
    // room: ROOM,
    room: PROJECT.rooms.find((r) => r.handle === params.handle),
    form: await superValidate(zod(boxSchema)),
  };
};

export const actions = {
  "create-box": async ({ locals, request, params, url }) => {
    console.log("Full params object:", JSON.stringify(params));
    console.log("Full URL:", url.pathname);

    if (!locals.user) {
      throw error(401, "Unauthorized");
    }

    const form = await superValidate(request, zod(boxSchema));

    try {
      // Get project handle from URL pathname
      const pathParts = url.pathname.split("/");
      const projectHandle = pathParts[2]; // /project/[projectHandle]/room/[roomHandle]
      const roomHandle = params.handle;

      console.log("Path parts:", pathParts);
      console.log("Extracted handles:", { projectHandle, roomHandle });

      if (!roomHandle || !projectHandle) {
        return fail(400, {
          form,
          message: "Both project and room handles are required",
        });
      }

      const PROJECT = await db.query.project.findFirst({
        where: eq(project.handle, projectHandle),
        columns: {
          id: true,
          userId: true,
          handle: true,
        },
      });

      if (!PROJECT) {
        return fail(404, {
          form,
          message: "Project not found",
        });
      }

      if (PROJECT.userId !== locals.user.id) {
        throw error(
          403,
          "You don't have permission to create boxes in this project",
        );
      }

      // Verify room ownership and get the room directly
      const ROOM = await db.query.room.findFirst({
        where: and(eq(room.handle, roomHandle), eq(room.projectId, PROJECT.id)),
      });

      if (!ROOM) {
        return fail(404, {
          form,
          message: "Room not found",
        });
      }

      // Use a transaction to ensure all operations succeed or fail together
      const newBox = await db.transaction(async (tx) => {
        const accessToken = crypto.randomUUID();
        const boxId = crypto.randomUUID();

        // Create a URL with both the box ID and access token
        const boxUrl = new URL(
          `${url.origin}/project/${projectHandle}/room/${ROOM.handle}/box/${boxId}`,
        );
        boxUrl.searchParams.set("token", accessToken);

        // Generate QR code with the complete URL including access token
        const qrCode = await QRCode.toString(boxUrl.toString(), {
          type: "svg",
          margin: 1,
          width: 256,
          // Optional: Add error correction level for better scanning
          errorCorrectionLevel: "M",
        });

        // Create the box
        const [createdBox] = await tx
          .insert(box)
          .values({
            id: boxId,
            roomId: ROOM.id,
            qrCode,
            notes: null,
            accessToken,
            isPublic: false,
          })
          .returning();

        // Create items if provided
        if (form.data.items?.length) {
          await Promise.all(
            form.data.items.map((itemData) =>
              tx.insert(item).values({
                boxId: createdBox.id,
                name: itemData.name,
                quantity: itemData.quantity,
              }),
            ),
          );
        }

        // Update room counts
        const itemCount =
          form.data.items?.reduce(
            (sum, item) => sum + (item.quantity || 0),
            0,
          ) || 0;

        await tx
          .update(room)
          .set({
            boxCount: ROOM.boxCount ? ROOM.boxCount + 1 : 1, // Fixed: Start from 1 instead of 0
            itemCount: ROOM.itemCount ? ROOM.itemCount + itemCount : itemCount,
          })
          .where(eq(room.id, ROOM.id));

        return createdBox;
      });

      // Redirect to the box view page
      throw redirect(303, `${params.handle}/box/${newBox.id}`);
    } catch (error) {
      if (error as Redirect) {
        throw error; // Re-throw redirect
      }
      console.error("Box Creation error:", error);
      return fail(500, {
        form,
        message: "An error occurred during box creation",
      });
    }
  },
} satisfies Actions;
