// src/routes/project/[handle]/room/[handle]/+page.server.ts
import {
  error,
  fail,
  redirect,
  type Actions,
  type Redirect,
} from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { box, item, project, room, qrCode } from "@db/schema";
import {
  and,
  count,
  eq,
  inArray,
  like,
  ne,
  notInArray,
  type ExtractTablesWithRelations,
} from "drizzle-orm";
import { message, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import boxSchema from "@routes/settings/zod/boxSchema";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import db from "@db";
import * as schema from "@db/schema";
import {
  downloadQrSchema,
  generateQrSchema,
  roomSchema,
} from "@routes/settings/zod";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import { generateHandle } from "@utils";

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.user) {
    throw redirect(302, "/login");
  }

  const { projectHandle, roomHandle } = params;
  console.log(params);

  // Get just the room we need with its boxes
  const ROOM = await db.query.room.findFirst({
    where: and(
      eq(room.handle, roomHandle),
      eq(
        room.projectId,
        db
          .select({ id: project.id })
          .from(project)
          .where(
            and(
              eq(project.handle, projectHandle),
              eq(project.userId, locals.user.id),
            ),
          )
          .limit(1),
      ),
    ),
    with: {
      boxes: {
        with: {
          qrCode: true,
          items: true,
        },
      },
    },
  });

  if (!ROOM) {
    throw redirect(302, "/dashboard");
  }

  // Get count of available QR codes for room
  const availableQrCodes = await db
    .select({ count: count() })
    .from(qrCode)
    .where(
      and(
        eq(qrCode.roomId, ROOM.id),
        eq(qrCode.isAssigned, false),
        eq(qrCode.isPreGenerated, true),
      ),
    )
    .limit(1)
    .then((res) => res[0].count);

  console.log(`Available QR Codes: ${availableQrCodes}`);

  return {
    room: ROOM,
    availableQrCodes,
    createBoxForm: await superValidate(zod(boxSchema)),
    generateQrForm: await superValidate(zod(generateQrSchema)),
    downloadQrForm: await superValidate(zod(downloadQrSchema)),
    updateRoomForm: await superValidate(zod(roomSchema)),
  };
};

export const actions = {
  "create-box": async ({ locals, request, params, url }) => {
    if (!locals.user) throw error(401, "Unauthorized");

    const form = await superValidate(request, zod(boxSchema));
    console.log(form);
    if (!form.valid) return fail(400, { form });

    const { projectHandle, roomHandle } = params;
    console.log(params);

    if (!roomHandle || !projectHandle) {
      return fail(400, {
        form,
        message: "Both project and room handles are required",
      });
    }

    try {
      // Combine project and room lookup into a single query
      const [result] = await db
        .select({
          project: { id: project.id },
          room: { id: room.id, handle: room.handle },
        })
        .from(project)
        .innerJoin(
          room,
          and(eq(room.projectId, project.id), eq(room.handle, roomHandle)),
        )
        .where(
          and(
            eq(project.handle, projectHandle),
            eq(project.userId, locals.user.id),
          ),
        )
        .limit(1);

      console.log("Result", result);

      if (!result) {
        return fail(404, { form, message: "Project or room not found" });
      }

      // First, find an available pre-generated QR code for room
      const [availableQrCode] = await db
        .select()
        .from(qrCode)
        .where(
          and(
            eq(qrCode.roomId, result.room.id),
            eq(qrCode.isPreGenerated, true),
            eq(qrCode.isAssigned, false),
          ),
        )
        .limit(1);

      if (!availableQrCode) {
        return fail(400, {
          form,
          message:
            "No QR codes available. Please generate more QR codes first.",
        });
      }

      const boxId = crypto.randomUUID();
      const accessToken = crypto.randomUUID();

      // Pre-generate QR code URL
      const boxUrl = new URL(
        `/project/${projectHandle}/room/${result.room.handle}/box/${boxId}`,
        `${url.protocol}//${url.host}`,
      );
      // boxUrl.searchParams.set("token", accessToken);

      // Prepare all insert values outside the transaction
      const boxValues = {
        id: boxId,
        roomId: result.room.id,
        accessToken,
        isPublic: false,
      };

      const itemValues =
        form.data.items?.map((itemData) => ({
          id: crypto.randomUUID(),
          boxId,
          name: itemData.name,
          quantity: itemData.quantity,
        })) ?? [];

      // Single transaction with all inserts
      await db.transaction(async (tx) => {
        await Promise.all([
          tx.insert(box).values(boxValues),
          tx
            .update(qrCode)
            .set({ boxId, isAssigned: true, url: boxUrl.toString() })
            .where(eq(qrCode.id, availableQrCode.id)),
          itemValues.length > 0
            ? tx.insert(item).values(itemValues)
            : Promise.resolve(),
        ]);
      });

      return message(form, {
        text: "Created Box!",
        location: `${url.pathname}/box/${boxId}`,
      });
    } catch (error) {
      console.error("Box Creation error:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });

      if (
        error instanceof Error &&
        error.message.toLowerCase().includes("duplicate key")
      ) {
        return fail(409, {
          form,
          message: "A box with this access token already exists",
        });
      }

      return fail(500, {
        form,
        message: "An error occurred during box creation",
      });
    }
  },
  "update-room": async ({ locals, request, params, url }) => {
    if (!locals.user) throw error(401, "Unauthorized");
    const userId = locals.user.id;

    const form = await superValidate(request, zod(roomSchema));
    if (!form.valid) {
      console.error("Validation failed:", form.errors);
      return fail(400, { form });
    }

    const { projectHandle, roomHandle } = params;
    if (!projectHandle || !roomHandle) {
      return fail(400, { form, message: "Project & Room handle required" });
    }

    try {
      const updatedRoomHandle = await db.transaction(async (tx) => {
        // Check if the project exists and belongs to the user
        const existingProject = await tx.query.project.findFirst({
          where: and(
            eq(project.handle, projectHandle),
            eq(project.userId, userId),
          ),
          with: { rooms: true },
        });

        if (!existingProject) {
          throw error(404, "Project not found or not owned by user");
        }

        // Find the room within the project
        const existingRoom = existingProject.rooms.find(
          (room) => room.handle === roomHandle,
        );

        if (!existingRoom) {
          throw error(404, "Room not found in the specified project");
        }

        // Generate new handle if name changed
        let uniqueHandle = roomHandle;
        if (form.data.name !== existingRoom.name) {
          uniqueHandle = await generateRoomHandle({
            tx,
            name: form.data.name,
            projectId: existingProject.id,
            currentId: existingRoom.id,
          });
        }

        // Update room first
        const [updatedRoom] = await tx
          .update(room)
          .set({
            handle: uniqueHandle,
            name: form.data.name,
            colorCode: form.data.colorCode,
          })
          .where(eq(room.id, existingRoom.id))
          .returning();

        console.log("Update Room result:", updatedRoom);

        // Handle boxes update if needed
        if (form.data.boxes && form.data.boxes.length > 0) {
          for (const boxData of form.data.boxes) {
            if (boxData.boxId) {
              // Update existing box
              await tx
                .update(box)
                .set({
                  notes: boxData.notes || null,
                })
                .where(eq(box.id, boxData.boxId));

              // Update items if they exist
              if (boxData.items && boxData.items.length > 0) {
                // Delete existing items
                await tx.delete(item).where(eq(item.boxId, boxData.boxId));

                // Insert new items with type checking
                const itemsToInsert = boxData.items
                  .filter(
                    (
                      itemData,
                    ): itemData is {
                      id: string;
                      name: string;
                      quantity: number;
                    } => {
                      return Boolean(itemData.name); // Only include items with names
                    },
                  )
                  .map((itemData) => ({
                    id: itemData.id || crypto.randomUUID(),
                    boxId: boxData.boxId!, // We know it's defined in this block
                    name: itemData.name,
                    quantity: itemData.quantity || 1,
                  }));

                if (itemsToInsert.length > 0) {
                  await tx.insert(item).values(itemsToInsert);
                }
              }
            } else {
              // Create new box
              const newBoxId = crypto.randomUUID();
              await tx.insert(box).values({
                id: newBoxId,
                roomId: existingRoom.id,
                notes: boxData.notes || null,
                isPublic: false,
                accessToken: crypto.randomUUID(),
              });

              // Insert items for new box if they exist
              if (boxData.items && boxData.items.length > 0) {
                const itemsToInsert = boxData.items
                  .filter(
                    (
                      itemData,
                    ): itemData is { name: string; quantity: number } => {
                      return Boolean(itemData.name); // Only include items with names
                    },
                  )
                  .map((itemData) => ({
                    id: crypto.randomUUID(),
                    boxId: newBoxId,
                    name: itemData.name,
                    quantity: itemData.quantity || 1,
                  }));

                if (itemsToInsert.length > 0) {
                  await tx.insert(item).values(itemsToInsert);
                }
              }
            }
          }

          // Delete boxes that are no longer in the form data
          const formBoxIds = form.data.boxes
            .map((b) => b.boxId)
            .filter((id): id is string => Boolean(id));

          if (formBoxIds.length > 0) {
            await tx
              .delete(box)
              .where(
                and(
                  eq(box.roomId, existingRoom.id),
                  notInArray(box.id, formBoxIds),
                ),
              );
          }
        }

        return uniqueHandle;
      });

      return message(form, {
        text: "Updated Room!",
        roomHandle: updatedRoomHandle,
      });
    } catch (error) {
      console.error("Room Update error:", error);
      console.error("Full error:", JSON.stringify(error, null, 2));
      return fail(500, { form, message: "Failed to update room" });
    }
  },
  "delete-room": async ({ locals, params }) => {
    if (!locals.user) throw error(401, "Unauthorized");
    const userId = locals.user.id;
    const { projectHandle, roomHandle } = params;

    if (!projectHandle || !roomHandle) {
      return fail(400, { message: "Project and room handles required" });
    }

    try {
      await db.transaction(async (tx) => {
        // First verify project exists and user owns it
        const existingProject = await tx.query.project.findFirst({
          where: and(
            eq(project.handle, projectHandle),
            eq(project.userId, userId),
          ),
          columns: { id: true },
        });

        if (!existingProject) {
          throw error(404, "Project not found or not owned by user");
        }

        // Find the room
        const existingRoom = await tx.query.room.findFirst({
          where: and(
            eq(room.handle, roomHandle),
            eq(room.projectId, existingProject.id),
          ),
          columns: { id: true },
          with: {
            boxes: {
              columns: { id: true },
            },
          },
        });

        if (!existingRoom) {
          throw error(404, "Room not found");
        }

        // Get box IDs for cleanup
        const boxIds = existingRoom.boxes.map((b) => b.id);

        if (boxIds.length > 0) {
          // Clean up items
          await tx.delete(item).where(inArray(item.boxId, boxIds));

          // Update QR codes to unassigned
          await tx
            .update(qrCode)
            .set({
              boxId: null,
              isAssigned: false,
            })
            .where(inArray(qrCode.boxId, boxIds));

          // Delete boxes
          await tx.delete(box).where(inArray(box.id, boxIds));
        }

        // Delete unassigned QR codes for this room
        await tx
          .delete(qrCode)
          .where(
            and(
              eq(qrCode.roomId, existingRoom.id),
              eq(qrCode.isAssigned, false),
            ),
          );

        // Finally delete the room
        await tx.delete(room).where(eq(room.id, existingRoom.id));
      });

      // Redirect back to project page
      throw redirect(303, `/project/${projectHandle}`);
    } catch (err) {
      if (err as Redirect) throw err;

      console.error("Room Delete error:", err);
      return fail(500, { message: "Failed to delete room" });
    }
  },
  "generate-qr": async ({ locals, request }) => {
    if (!locals.user) throw error(401);
    const form = await superValidate(request, zod(generateQrSchema));
    if (!form.valid) return fail(400, { form });

    const { roomId, count: generationCount } = form.data;

    // First, retrieve the project and room handles
    const roomDetails = await db
      .select({
        roomHandle: room.handle,
        projectHandle: project.handle,
        colorCode: room.colorCode,
      })
      .from(room)
      .innerJoin(project, eq(room.projectId, project.id))
      .where(eq(room.id, roomId))
      .limit(1)
      .then((result) => result[0]);

    if (!roomDetails) {
      return fail(404, { form, message: "Room not found" });
    }

    const availableQrCodeCount = await db
      .select({ count: count() })
      .from(qrCode)
      .where(
        and(
          eq(qrCode.roomId, form.data.roomId),
          eq(qrCode.isAssigned, false),
          eq(qrCode.isPreGenerated, true),
        ),
      )
      .then((res) => res[0].count);

    if (availableQrCodeCount >= 100) {
      return fail(400, {
        form,
        message:
          "You have sufficient QR codes available. Please use existing codes before generating more.",
      });
    }
    // Start a transaction for batch QR code creation
    try {
      // Create a PDF document
      const doc = new PDFDocument({
        size: "A4",
        margin: 10,
        autoFirstPage: true,
      });
      // Create arrays to collect chunks of PDF data
      const chunks: Buffer[] = [];
      // Set up event listeners for the PDF document
      doc.on("data", (chunk) => chunks.push(chunk));

      const pdfComplete = new Promise<void>((resolve) => {
        doc.on("end", () => resolve());
      });

      console.log("Starting QR generation");
      const qrCodes = await db.transaction(async (tx) => {
        const codes = [];

        const codesPerPage = 9;

        // Generate all QR codes in a batch
        for (var i = 0; i < generationCount; i++) {
          // Calculate which page we're on and the position within that page
          // const currentPage = Math.floor(i / codesPerPage);
          const positionOnPage = i % codesPerPage;

          if (positionOnPage === 0 && i > 0) {
            doc.addPage();
          }

          const boxId = crypto.randomUUID(); // Generate potential future box ID
          const accessToken = crypto.randomUUID();

          const url = new URL(request.url);
          const baseUrl = `${url.protocol}//${url.host}`;
          const boxUrl = new URL(
            `/project/${roomDetails.projectHandle}/room/${roomDetails.roomHandle}/box/${boxId}`,
            baseUrl,
          );
          // boxUrl.searchParams.set("token", accessToken);

          // Insert new QR code
          const [newQrCode] = await tx
            .insert(qrCode)
            .values({
              id: crypto.randomUUID(),
              roomId,
              url: boxUrl.toString(),
              isPreGenerated: true,
              isAssigned: false,
              boxId: null,
            })
            .returning();

          codes.push(newQrCode);

          // Generate QR code SVG
          const qrDataUrl = await QRCode.toDataURL(boxUrl.toString(), {
            margin: 0,
            width: 150,
            errorCorrectionLevel: "M",
          });

          const col = Math.floor(positionOnPage / 3);
          const row = positionOnPage % 3;

          const xPos = row * 200 + 20;
          const yPos = col * 250 + 20;

          // Draw colored border
          doc.save();
          doc
            .roundedRect(xPos - 8, yPos - 8, 165, 165, 10)
            .lineWidth(8)
            .stroke(roomDetails.colorCode);
          doc.restore();

          doc.image(qrDataUrl, xPos, yPos, {
            width: 150,
            height: 150,
          });

          // Add box identifier below QR code
          doc.font("Helvetica").fontSize(10);
          doc.text(`Box #${availableQrCodeCount + i + 1}`, xPos, yPos + 170, {
            width: 150,
            align: "center",
          });
          doc.font("Helvetica").fontSize(8);
          doc.text(boxUrl.toString(), xPos, yPos + 185, {
            width: 150,
            align: "center",
          });
        }

        return codes;
      });
      console.log("QR codes generated:", qrCodes.length);

      // Finalize the PDF doc.end();
      doc.end();

      // Wait for PDF generation to complete
      await pdfComplete;
      console.log("PDF generated");

      // Combine all chunks into final PDF dat
      const pdfData = Buffer.concat(chunks);

      const newCount = await db
        .select({ count: count() })
        .from(qrCode)
        .where(
          and(
            eq(qrCode.roomId, form.data.roomId),
            eq(qrCode.isAssigned, false),
            eq(qrCode.isPreGenerated, true),
          ),
        )
        .limit(1)
        .then((res) => res[0].count);
      console.log("New count:", newCount);
      return {
        form,
        availableQrCodesCount: newCount,
        pdf: pdfData.toString("base64"),
      };
    } catch (err: any) {
      console.error("Error generating QR codes:", err);
      throw error(500, "Failed to generate QR codes");
    }
  },
  "download-all-generated": async ({ locals, params, request }) => {
    if (!locals.user) throw error(401, "Unauthorized");
    const form = await superValidate(request, zod(downloadQrSchema));
    if (!form.valid) return fail(400, { form });

    // const { projectHandle, roomHandle } = params;
    // console.log(params);

    const { roomId } = form.data;

    try {
      const ROOM = await db
        .select({
          id: room.id,
          colorCode: room.colorCode,
        })
        .from(room)
        .where(eq(room.id, roomId))
        .limit(1)
        .then((result) => result[0]);

      if (!ROOM) return fail(404, { form, message: "Room not found" });

      // // Combine project and room lookup into a single query
      // const [result] = await db
      //   .select({
      //     project: { id: project.id },
      //     room: { id: room.id, handle: room.handle, colorCode: room.colorCode },
      //   })
      //   .from(project)
      //   .innerJoin(
      //     room,
      //     and(eq(room.projectId, project.id), eq(room.handle, roomHandle)),
      //   )
      //   .where(
      //     and(
      //       eq(project.handle, projectHandle),
      //       eq(project.userId, locals.user.id),
      //     ),
      //   )
      //   .limit(1);

      // if (!result) {
      //   return fail(404, { message: "Project or room not found" });
      // }

      // First, find an available pre-generated QR code for room
      const availableQrCodes = await db
        .select()
        .from(qrCode)
        .where(
          and(
            eq(qrCode.roomId, ROOM.id),
            eq(qrCode.isPreGenerated, true),
            eq(qrCode.isAssigned, false),
          ),
        );

      // Create a PDF document
      const doc = new PDFDocument({
        size: "A4",
        margin: 10,
        autoFirstPage: true,
      });
      // Create arrays to collect chunks of PDF data
      const chunks: Buffer[] = [];
      // Set up event listeners for the PDF document
      doc.on("data", (chunk) => chunks.push(chunk));

      const pdfComplete = new Promise<void>((resolve) => {
        doc.on("end", () => resolve());
      });

      const codesPerPage = 9;

      // Generate all QR codes in a batch
      for (var i = 0; i < availableQrCodes.length; i++) {
        // Calculate which page we're on and the position within that page
        // const currentPage = Math.floor(i / codesPerPage);
        const positionOnPage = i % codesPerPage;
        const boxUrl = availableQrCodes[i].url;

        if (positionOnPage === 0 && i > 0) {
          doc.addPage();
        }

        // Generate QR code SVG
        const qrDataUrl = await QRCode.toDataURL(boxUrl.toString(), {
          margin: 0,
          width: 150,
          errorCorrectionLevel: "M",
        });

        const col = Math.floor(positionOnPage / 3);
        const row = positionOnPage % 3;

        const xPos = row * 200 + 20;
        const yPos = col * 250 + 20;

        // Draw colored border
        doc.save();
        doc
          .roundedRect(xPos - 8, yPos - 8, 165, 165, 10)
          .lineWidth(8)
          .stroke(ROOM.colorCode);
        doc.restore();

        doc.image(qrDataUrl, xPos, yPos, {
          width: 150,
          height: 150,
        });

        // Add box identifier below QR code
        doc.font("Helvetica").fontSize(10);
        doc.text(`Box #${i + 1}`, xPos, yPos + 170, {
          width: 150,
          align: "center",
        });
        doc.font("Helvetica").fontSize(8);
        doc.text(boxUrl.toString(), xPos, yPos + 185, {
          width: 150,
          align: "center",
        });
      }

      // Finalize the PDF
      doc.end();

      // Wait for PDF generation to complete
      await pdfComplete;

      // Combine all chunks into final PDF dat
      const pdfData = Buffer.concat(chunks);

      return {
        form,
        pdf: pdfData.toString("base64"),
      };
    } catch (err: any) {
      console.error("Error downloading available QR codes:", err);
      throw error(500, "Failed to download QR codes");
    }
  },
} satisfies Actions;

type DbTransaction = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;
type GenerateRoomHandleParams = {
  tx: DbTransaction;
  name: string;
  projectId: string;
  currentId: string;
};

async function generateRoomHandle(
  params: GenerateRoomHandleParams,
): Promise<string> {
  const { tx, name, projectId, currentId } = params;
  const baseHandle = generateHandle(name);

  const existingRooms = await tx
    .select({ handle: room.handle })
    .from(room)
    .where(
      and(
        eq(room.projectId, projectId),
        like(room.handle, `${baseHandle}%`),
        ne(room.id, currentId),
      ),
    );

  return existingRooms.length > 0
    ? `${baseHandle}-${existingRooms.length + 1}`
    : baseHandle;
}
