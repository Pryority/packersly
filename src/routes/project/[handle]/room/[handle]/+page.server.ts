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
import { box, item, room } from "@db/schema";
import { eq } from "drizzle-orm";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import boxSchema from "@routes/settings/zod/boxSchema";

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
  "create-box": async ({ locals, request, params }) => {
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

      // Now TypeScript knows handle is a string
      const ROOM = await db.query.room.findFirst({
        where: eq(room.handle, handle),
      });

      if (!ROOM) {
        return fail(404, {
          form,
          message: "Room not found",
        });
      }
      // Use a transaction to ensure all operations succeed or fail together
      const newBox = await db.transaction(async (tx) => {
        // Create the box first
        const [createdBox] = await tx
          .insert(box)
          .values({
            roomId: ROOM.id,
            qrCode: crypto.randomUUID(), // Generate a unique QR code
            notes: null, // Add notes if you have them in your form
            accessToken: crypto.randomUUID(), // Generate a unique access token
            isPublic: false,
          })
          .returning();

        // If we have items, create them
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

        // Update room's box and item counts
        const itemCount =
          form.data.items?.reduce(
            (sum, item) => sum + (item.quantity || 0),
            0,
          ) || 0;
        await tx
          .update(room)
          .set({
            boxCount: ROOM.boxCount ? ROOM.boxCount + 1 : 0,
            itemCount: ROOM.itemCount ? ROOM.itemCount + itemCount : 0,
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
