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
          boxes: {
            with: {
              items: true,
            },
          },
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
      try {
        // Precompute values before the transaction starts
        const boxId = crypto.randomUUID();
        const accessToken = crypto.randomUUID();

        console.log("Precomputed IDs:", { boxId, accessToken });

        // Precompute box URL
        const boxUrl = new URL(
          `${url.origin}/project/${projectHandle}/room/${ROOM.handle}/box/${boxId}`,
        );
        boxUrl.searchParams.set("token", accessToken);

        console.log("Precomputed Box URL:", boxUrl.toString());

        // Generate QR code before the transaction
        const qrCode = await Promise.race([
          QRCode.toString(boxUrl.toString(), {
            type: "svg",
            margin: 1,
            width: 256,
            errorCorrectionLevel: "M",
          }),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("QR Code generation timeout")),
              5000,
            ),
          ),
        ]);

        console.log("Precomputed QR code generated");

        // Start transaction with precomputed data
        const newBox = await db.transaction(async (tx) => {
          console.log("Transaction started", new Date().toISOString());
          try {
            // Insert the box into the database
            const result = await tx
              .insert(box)
              .values({
                id: boxId,
                roomId: ROOM.id,
                qrCode: qrCode as string, // Use precomputed QR code
                notes: null,
                accessToken: accessToken, // Use precomputed accessToken
                isPublic: false,
              } satisfies typeof box.$inferInsert)
              .returning();

            console.log("Box created in database");

            const createdBox = result[0];
            if (!createdBox) throw new Error("Failed to create box");

            // Insert items if they exist
            if (form.data.items?.length) {
              console.log(`Inserting ${form.data.items.length} items`);
              const itemInsertPromises = form.data.items.map((itemData) =>
                tx.insert(item).values({
                  boxId: boxId,
                  name: itemData.name,
                  quantity: itemData.quantity,
                } satisfies typeof item.$inferInsert),
              );

              const itemInsertResults =
                await Promise.allSettled(itemInsertPromises);
              const failedInserts = itemInsertResults.filter(
                (result) => result.status === "rejected",
              );

              if (failedInserts.length > 0) {
                console.error("Failed item inserts:", failedInserts);
                throw new Error(
                  `Failed to insert ${failedInserts.length} items`,
                );
              }
              console.log("Items inserted successfully");
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
                boxCount: ROOM.boxCount ? ROOM.boxCount + 1 : 1,
                itemCount: ROOM.itemCount
                  ? ROOM.itemCount + itemCount
                  : itemCount,
              })
              .where(eq(room.id, ROOM.id));
            console.log("Room counts updated");

            return createdBox;
          } catch (innerError: any) {
            console.error("Transaction inner error:", innerError);
            throw innerError;
          }
        });

        console.log("Transaction complete:", newBox);

        // console.log("Transaction completed successfully");

        // Ensure redirect path is absolute and type safety
        if (!newBox?.id)
          throw new Error("Box creation failed - no ID returned");
        const redirectPath = `${url.pathname}/box/${boxId}`;
        console.log("Redirecting to:", redirectPath);

        throw redirect(303, redirectPath);
      } catch (error: any) {
        // Log full error details
        console.error("Box Creation error:", {
          error,
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: error.code,
        });

        if (error as Redirect) {
          console.log("Throwing redirect");
          throw error;
        }

        // Check for connection-related errors
        if (
          error.message?.includes("connection") ||
          error.message?.includes("timeout") ||
          error.code === "40P01" // deadlock
        ) {
          return fail(503, {
            form,
            message: "Service temporarily unavailable. Please try again.",
          });
        }

        return fail(500, {
          form,
          message: "An error occurred during box creation",
        });
      }
    } catch (outerError: any) {
      console.error("Outer error:", outerError);
      if (outerError as Redirect) {
        throw outerError;
      }
      return fail(500, {
        form,
        message: "An unexpected error occurred",
      });
    }
  },
} satisfies Actions;
