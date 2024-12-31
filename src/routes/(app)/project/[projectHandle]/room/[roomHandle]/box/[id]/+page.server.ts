// src/routes/project/[handle]/room/[handle]/box/[id]/+page.server.ts
import {
  error,
  redirect,
  fail,
  type Actions,
  type Redirect,
} from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { box, item, project, qrCode, room } from "@db/schema";
import { and, eq, like } from "drizzle-orm";
import { downloadQrSchema, itemSchema } from "@routes/settings/zod";
import { zod } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms";
import db from "@db";
import { validate as validateUUID } from "uuid";

export const load: PageServerLoad = async ({ locals, params, url }) => {
  console.log("Box ID param:", params.id);
  if (!validateUUID(params.id)) {
    throw error(400, "Invalid box ID format");
  }
  if (!locals.user) {
    throw redirect(302, "/login");
  }

  // First check for a QR code with this box ID
  const QRCODE = await db.query.qrCode.findFirst({
    where: like(qrCode.url, `%/box/${params.id}%`),
    with: {
      room: {
        with: {
          project: true,
        },
      },
    },
  });

  if (QRCODE) {
    if (!QRCODE.isAssigned) {
      // QR exists but no box yet - show placeholder page
      return {
        qrCode: QRCODE,
        box: null,
        form: await superValidate(zod(downloadQrSchema)),
      };
    }
  }
  console.log("LOADING BOX DATA");
  // First, get the box with its relationships
  const BOX = await db.query.box.findFirst({
    where: eq(box.id, params.id),
    with: {
      items: true,
      qrCode: true, // Add this line to include the QR code relation
      room: {
        with: {
          project: {
            columns: {
              id: true,
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!BOX) {
    throw error(404, "Box not found");
  }

  // Get access token from query parameter if it exists
  const accessToken = url.searchParams.get("token");

  // Check if the user has access to this box
  const hasAccess =
    // User owns the project
    BOX.room?.project.userId === locals.user.id ||
    // Or the box is public (if you want to keep this option)
    BOX.isPublic ||
    // Or user has explicit access through a shared link (optional)
    (accessToken && BOX.accessToken === accessToken);

  if (!hasAccess) {
    throw error(403, "You don't have permission to view this box");
  }

  return {
    box: {
      ...BOX,
      // Only include access token if user owns the project
      accessToken:
        BOX.room?.project.userId === locals.user.id
          ? BOX.accessToken
          : undefined,
    },
    downloadQrForm: await superValidate(zod(downloadQrSchema)),
    createItemForm: await superValidate(zod(itemSchema)),
  };
};

export const actions = {
  "create-item": async ({ locals, request, params }) => {
    if (!locals.user) {
      throw error(401, "Unauthorized");
    }
    const form = await superValidate(request, zod(itemSchema));
    if (!form.valid) {
      console.log("Form validation failed:", form.errors);
      return fail(400, { form });
    }

    try {
      const { projectHandle, roomHandle, id: boxId } = params;
      console.log(params);
      if (!projectHandle || !roomHandle || !boxId) {
        return fail(400, {
          form,
          message: "Project, room, and box details are required",
        });
      }
      console.log("querying for project");
      // Verify project and ownership
      const PROJECT = await db.query.project.findFirst({
        where: eq(project.handle, projectHandle),
        columns: {
          id: true,
          userId: true,
        },
      });
      console.log("PROJECT", PROJECT);
      if (!PROJECT || PROJECT.userId !== locals.user.id) {
        throw error(
          403,
          "You don't have permission to create items in this project",
        );
      }
      // Verify room exists in the project
      const ROOM = await db.query.room.findFirst({
        where: and(eq(room.handle, roomHandle), eq(room.projectId, PROJECT.id)),
        columns: {
          id: true,
        },
      });
      console.log("ROOM", ROOM);
      if (!ROOM) {
        return fail(404, {
          form,
          message: "Room not found or does not belong to this project",
        });
      }
      // Verify box exists in the room
      const BOX = await db.query.box.findFirst({
        where: and(eq(box.id, boxId), eq(box.roomId, ROOM.id)),
        columns: {
          id: true,
        },
      });
      if (!BOX) {
        return fail(404, {
          form,
          message: "Box not found or does not belong to this room",
        });
      }
      // Create the item
      const newItem = await db.transaction(async (tx) => {
        const itemId = crypto.randomUUID();
        const [createdItem] = await tx
          .insert(item)
          .values({
            id: itemId,
            boxId: BOX.id,
            name: form.data.name,
            quantity: form.data.quantity,
          })
          .returning();
        return createdItem;
      });
      console.log("NEW ITEM", newItem);
      // Redirect to the box details page
      throw redirect(
        303,
        `/project/${projectHandle}/room/${roomHandle}/box/${boxId}`,
      );
    } catch (error) {
      if (error as Redirect) {
        throw error; // Re-throw redirect
      }
      console.error("Item Creation error:", error);
      return fail(500, {
        form,
        message: "An error occurred during item creation",
      });
    }
  },
  download: async ({ request }) => {
    const form = await superValidate(request, zod(downloadQrSchema));
    if (!form.valid) {
      return fail(400, { form });
    }
    return { success: true };
  },
} satisfies Actions;
