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
import { box, item, room, type Box } from "@db/schema";
import { eq } from "drizzle-orm";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import boxSchema from "@routes/settings/zod/boxSchema";
import QRCode from "qrcode";

export const load: PageServerLoad = async ({ locals, url, params }) => {
  if (!locals.user) {
    throw redirect(302, "/login");
  }

  // Use the room handle from params instead of trying to parse URL
  const roomHandle = params.handle;

  // First get the room by its handle
  const ROOM = await db.query.room.findFirst({
    where: eq(room.handle, roomHandle),
    with: {
      boxes: {
        with: {
          items: true,
        },
      },
    },
  });

  if (!ROOM) {
    throw redirect(302, "/dashboard"); // or handle the "room not found" case differently
  }

  console.log("[Room Handle Page Server] Load Data:", { ROOM });

  return {
    room: ROOM,
    boxes: ROOM.boxes,
    form: await superValidate(zod(boxSchema)),
  };
};

export const actions = {
  "create-box": async ({ locals, request, params, url }) => {
    // Destructure params from event
    console.log("Action started");
    if (!locals.user) {
      throw error(401, "Unauthorized");
    }

    const form = await superValidate(request, zod(boxSchema));
    console.log("Form data received:", form.data);

    if (!form.valid) {
      console.log("Form validation failed:", form.errors);
      return fail(400, { form });
    }

    try {
      // Check if handle exists and type assert it
      const handle = params.handle;
      if (!handle) {
        return fail(400, {
          form,
          message: "Room handle is required",
        });
      }

      // Verify room ownership
      const ROOM = await db.query.room.findFirst({
        where: eq(room.handle, handle),
        with: {
          project: {
            columns: {
              userId: true,
            },
          },
        },
      });

      if (!ROOM) {
        return fail(404, {
          form,
          message: "Room not found",
        });
      }

      // Verify user owns the project
      if (ROOM.project.userId !== locals.user.id) {
        throw error(
          403,
          "You don't have permission to create boxes in this room",
        );
      }

      // Use a transaction to ensure all operations succeed or fail together
      const newBox = await db.transaction(async (tx) => {
        const accessToken = crypto.randomUUID();
        const boxId = crypto.randomUUID();

        // Create a URL with both the box ID and access token
        const boxUrl = new URL(
          `${url.origin}/project/${handle}/room/${ROOM.handle}/box/${boxId}`,
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
