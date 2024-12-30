// src/routes/project/[handle]/room/[handle]/+page.server.ts
import {
  error,
  fail,
  json,
  redirect,
  type Actions,
  type Redirect,
} from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { box, item, project, room, qrCode } from "@db/schema";
import { and, count, eq } from "drizzle-orm";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import boxSchema from "@routes/settings/zod/boxSchema";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import db from "@db";
import { generateQrSchema } from "@routes/settings/zod";

export const load: PageServerLoad = async ({ locals, url, params }) => {
  if (!locals.user) {
    throw redirect(302, "/login");
  }

  const urlPathname = url.pathname; // "/project/the-big-move"
  const pathSegments = urlPathname.split("/");
  const projectHandle = pathSegments[2]; // "the-big-move"

  // Get just the room we need with its boxes
  const ROOM = await db.query.room.findFirst({
    where: and(
      eq(room.handle, params.handle),
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
  };
};

export const actions = {
  "create-box": async ({ locals, request, params, url }) => {
    if (!locals.user) throw error(401, "Unauthorized");

    const form = await superValidate(request, zod(boxSchema));
    if (!form.valid) return fail(400, { form });

    const pathParts = url.pathname.split("/");
    const projectHandle = pathParts[2];
    const roomHandle = params.handle;

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

      // const qrValues = {
      // 	boxId,
      // 	url: boxUrl.toString(),
      // };

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

      throw redirect(303, `${url.pathname}/box/${boxId}`);
    } catch (error) {
      if (error as Redirect) throw error;

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

    if (availableQrCodeCount > 100) {
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
            margin: 1,
            width: 150,
            errorCorrectionLevel: "M",
          });

          const col = Math.floor(positionOnPage / 3);
          const row = positionOnPage % 3;

          const xPos = row * 200 + 20;
          const yPos = col * 250 + 20;

          // Add QR code to PDF
          doc.image(qrDataUrl, xPos, yPos, {
            width: 150,
            height: 150,
          });

          // Add box identifier below QR code
          doc.font("Helvetica").fontSize(10);
          doc.text(`Box #${availableQrCodeCount + i + 1}`, xPos, yPos + 160, {
            width: 150,
            align: "center",
          });
          doc.font("Helvetica").fontSize(8);
          doc.text(boxUrl.toString(), xPos, yPos + 175, {
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
  "download-all-generated": async ({ locals, params, url }) => {
    if (!locals.user) throw error(401, "Unauthorized");

    const pathParts = url.pathname.split("/");
    const projectHandle = pathParts[2];
    const roomHandle = params.handle;

    if (!roomHandle || !projectHandle) {
      return fail(400, {
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

      if (!result) {
        return fail(404, { message: "Project or room not found" });
      }

      // First, find an available pre-generated QR code for room
      const availableQrCodes = await db
        .select()
        .from(qrCode)
        .where(
          and(
            eq(qrCode.roomId, result.room.id),
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
          margin: 1,
          width: 150,
          errorCorrectionLevel: "M",
        });

        const row = Math.floor(positionOnPage / 3);
        const col = positionOnPage % 3;

        const xPos = row * 200 + 20;
        const yPos = col * 250 + 20;

        // Add QR code to PDF
        doc.image(qrDataUrl, xPos, yPos, {
          width: 150,
          height: 150,
        });

        // Add box identifier below QR code
        doc.font("Helvetica").fontSize(10);
        doc.text(`Box #${i + 1}`, xPos, yPos + 160, {
          width: 150,
          align: "center",
        });
        doc
          .text(boxUrl.toString(), xPos, yPos + 175, {
            width: 150,
            align: "center",
          })
          .fontSize(4);
      }

      // Finalize the PDF
      doc.end();

      // Wait for PDF generation to complete
      await pdfComplete;

      // Combine all chunks into final PDF dat
      const pdfData = Buffer.concat(chunks);

      return new Response(pdfData, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="qr-codes.pdf"`,
        },
      });
    } catch (err: any) {
      console.error("Error downloading available QR codes:", err);
      throw error(500, "Failed to download QR codes");
    }
  },
} satisfies Actions;
