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
import { and, eq, inArray, like, notInArray } from "drizzle-orm";
import { boxSchema, downloadQrSchema, itemSchema } from "@routes/settings/zod";
import { zod } from "sveltekit-superforms/adapters";
import { message, superValidate } from "sveltekit-superforms";
import db from "@db";
import { validate as validateUUID } from "uuid";
export const load: PageServerLoad = async ({ locals, params, url }) => {
  // console.log("Box ID param:", params.boxId);
  if (!validateUUID(params.boxId)) {
    throw error(400, "Invalid box ID format");
  }
  if (!locals.user) {
    throw redirect(302, "/login");
  }

  // First check for a QR code with this box ID
  const QRCODE = await db.query.qrCode.findFirst({
    where: like(qrCode.url, `%/box/${params.boxId}%`),
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
        downloadQrForm: await superValidate(zod(downloadQrSchema)),
        createItemForm: await superValidate(zod(itemSchema)),
        boxUpdateForm: await superValidate(zod(boxSchema)),
      };
    }
  }
  console.log("LOADING BOX DATA");
  // First, get the box with its relationships
  const BOX = await db.query.box.findFirst({
    where: eq(box.id, params.boxId),
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

  // Check for inconsistent state - box has items but no assigned QR code
  if (BOX.items.length > 0 && (!BOX.qrCode || !BOX.qrCode.isAssigned)) {
    // Auto-fix the state by creating and assigning a QR code
    if (!BOX.room?.id) {
      throw error(500, "Box is in an invalid state: no room assigned");
    }

    const [newQrCode] = await db
      .insert(qrCode)
      .values({
        roomId: BOX.room.id,
        url: `/box/${BOX.id}`,
        id: crypto.randomUUID(),
        boxId: BOX.id,
        isAssigned: true,
        isPreGenerated: false,
      })
      .returning();

    // Update the box object with the new QR code
    BOX.qrCode = newQrCode;
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
    boxUpdateForm: await superValidate(zod(boxSchema)),
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
      // First, try to find the QR code
      const QRCODE = await db.query.qrCode.findFirst({
        where: like(qrCode.url, `%/box/${boxId}%`),
        with: {
          room: true,
        },
      });

      if (!QRCODE) {
        return fail(404, {
          form,
          message: "No QR code found for this box",
        });
      }

      // Create a box if it doesn't exist
      let BOX = await db.query.box.findFirst({
        where: eq(box.id, boxId),
      });

      if (!BOX) {
        const [createdBox] = await db
          .insert(box)
          .values({
            id: boxId,
            roomId: QRCODE.room.id,
            accessToken: crypto.randomUUID(), // Generate a unique access token
          })
          .returning();

        BOX = createdBox;
      }

      // Create the item
      const newItem = await db.transaction(async (tx) => {
        // Update QR code if not already associated
        if (!QRCODE.isAssigned) {
          await tx
            .update(qrCode)
            .set({
              boxId: BOX.id,
              isAssigned: true,
              url: QRCODE.url, // Or generate a new URL if needed
            })
            .where(eq(qrCode.id, QRCODE.id));
        }
        const existingItem = await tx.query.item.findFirst({
          where: and(eq(item.name, form.data.name), eq(item.boxId, BOX.id)),
        });

        if (existingItem && existingItem.quantity) {
          const [updatedItem] = await tx
            .update(item)
            .set({ quantity: existingItem.quantity + form.data.quantity })
            .where(eq(item.id, existingItem.id))
            .returning();
          console.log("UPDATED EXISTING ITEM QUANTITY", updatedItem);
          return updatedItem;
        }
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
      return message(form, "Created Item!");
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
  "update-box": async ({ locals, request }) => {
    if (!locals.user) throw error(401, "Unauthorized");

    const form = await superValidate(request, zod(boxSchema));
    console.log("Form data:", form.data);

    if (!form.valid) return fail(400, { form });

    const { boxId, items } = form.data;

    if (!boxId) return fail(400, { form, message: "Box ID is required" });

    try {
      // First get existing box items for comparison
      const existingItems = await db
        .select()
        .from(item)
        .where(eq(item.boxId, boxId));

      console.log("Existing box items:", existingItems);
      console.log("Form items:", items);

      // Group items into categories
      const existingItemIds = new Set(existingItems.map((i) => i.id));
      const formItemIds = new Set(items.filter((i) => i.id).map((i) => i.id));

      const itemsToUpdate = items.filter(
        (i) => i.id && existingItemIds.has(i.id),
      );
      const itemsToAdd = items.filter((i) => !i.id);
      const itemIdsToDelete = [...existingItemIds].filter(
        (id) => !formItemIds.has(id),
      );

      // Perform all operations in a transaction
      await db.transaction(async (tx) => {
        // 1. Update existing items
        if (itemsToUpdate.length > 0) {
          await Promise.all(
            itemsToUpdate.map((updateItem) =>
              tx
                .update(item)
                .set({
                  name: updateItem.name,
                  quantity: updateItem.quantity,
                  updatedAt: new Date(),
                })
                .where(eq(item.id, updateItem.id!)),
            ),
          );
        }

        // 2. Add new items
        if (itemsToAdd.length > 0) {
          await tx.insert(item).values(
            itemsToAdd.map((newItem) => ({
              id: crypto.randomUUID(),
              boxId,
              name: newItem.name,
              quantity: newItem.quantity,
            })),
          );
        }

        // 3. Delete removed items
        if (itemIdsToDelete.length > 0) {
          await tx.delete(item).where(inArray(item.id, itemIdsToDelete));
        }
      });

      return {
        form,
        message: "Box updated successfully",
      };
    } catch (error) {
      console.error("Box update error:", error);
      return fail(500, {
        form,
        message: "Failed to update box",
      });
    }
  },
  "delete-box": async ({ locals, params }) => {
    if (!locals.user) throw error(401, "Unauthorized");
    const userId = locals.user.id;
    const { projectHandle, roomHandle, boxId } = params;

    if (!projectHandle || !roomHandle || !boxId) {
      return fail(400, { message: "Project & Room Handle & Box ID required" });
    }

    try {
      // First verify ownership by checking the chain of relationships
      const boxWithOwnership = await db.query.box.findFirst({
        where: eq(box.id, boxId),
        with: {
          room: {
            with: {
              project: {
                columns: {
                  userId: true,
                },
              },
            },
          },
        },
      });

      if (!boxWithOwnership) {
        return fail(404, { message: "Box not found" });
      }

      if (boxWithOwnership.room?.project?.userId !== userId) {
        throw error(403, "You don't have permission to delete this box");
      }

      // If we get here, user owns the box and we can delete it
      await db.delete(box).where(eq(box.id, boxId));

      // Redirect to the room page instead of dashboard
      throw redirect(303, `/project/${projectHandle}/room/${roomHandle}`);
    } catch (err) {
      if (err as Redirect) throw err;
      if (err instanceof Error && err.message.includes("permission")) {
        throw err; // Rethrow permission errors
      }
      console.error("Box Delete error:", err);
      return fail(500, { message: "Failed to delete box" });
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
