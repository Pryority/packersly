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
import { and, eq, like, notInArray } from "drizzle-orm";
import { boxSchema, downloadQrSchema, itemSchema } from "@routes/settings/zod";
import { zod } from "sveltekit-superforms/adapters";
import { message, superValidate } from "sveltekit-superforms";
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
        downloadQrForm: await superValidate(zod(downloadQrSchema)),
        createItemForm: await superValidate(zod(itemSchema)),
        boxUpdateForm: await superValidate(zod(boxSchema)),
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
  "update-box": async ({ request, locals, url }) => {
    if (!locals.user) throw error(401, "Unauthorized");
    const form = await superValidate(request, zod(boxSchema));
    console.log("Form data:", form.data);
    if (!form.valid) return fail(400, { form });
    const boxId = form.data.boxId;
    if (!boxId) return fail(400, { form, message: "Box ID required" });

    try {
      return await db.transaction(async (tx) => {
        const BOX = await tx.query.box.findFirst({
          where: eq(box.id, boxId),
          with: {
            items: true,
            room: {
              with: {
                project: {
                  columns: { userId: true },
                },
              },
            },
          },
        });

        if (!BOX || BOX.room?.project.userId !== locals.user?.id) {
          return fail(403, { message: "Box not found or unauthorized" });
        }

        console.log("Existing box items:", BOX.items);
        console.log("Form items:", form.data.items);

        // Update existing items with ID matches
        for (const formItem of form.data.items) {
          if (formItem.id) {
            const result = await tx
              .update(item)
              .set({
                name: formItem.name,
                quantity: formItem.quantity,
              })
              .where(eq(item.id, formItem.id))
              .returning();
            console.log("Update result:", result);
            // const p1 = tx
            //   .update(item)
            //   .set({
            //     name: formItem.name,
            //     quantity: formItem.quantity,
            //   })
            //   .where(eq(item.id, formItem.id))
            //   .prepare("p1");
            // const result = await p1.execute({ id: 1 });
            // console.log("SQL Query:", result);
          } else {
            console.log("Inserting new item:", formItem);
            await tx.insert(item).values({
              id: crypto.randomUUID(),
              boxId: BOX.id,
              name: formItem.name,
              quantity: formItem.quantity,
            });
          }
        }

        // Delete removed items
        const formItemIds = form.data.items.map((i) => i.id).filter(Boolean);
        const deleteResult = await tx
          .delete(item)
          .where(
            and(
              eq(item.boxId, BOX.id),
              notInArray(item.id, formItemIds as string[]),
            ),
          )
          .returning();
        console.log("Delete result:", deleteResult);

        return message(form, "Updated Box!");
      });
    } catch (error) {
      console.error("Full error:", error);
      if (error as Redirect) throw error;
      console.error("Box Update error:", error);
      return fail(500, { form, error: "Update failed" });
    }
  },
  "delete-box": async ({ locals, request }) => {
    if (!locals.user) throw error(401);

    const formData = await request.formData();
    const boxId = formData.get("boxId")?.toString();

    if (!boxId) return fail(400, { message: "Box ID is required" });

    try {
      const deleteResult = await db
        .delete(box)
        .where(eq(box.id, boxId))
        .returning();
      console.log(deleteResult);
      return { success: true };
    } catch (err) {
      console.error("Error deleting box:", err);
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
