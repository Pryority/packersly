// src/routes/api/qr-code/download/pdf/+server.ts
import { error, type RequestHandler } from "@sveltejs/kit";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { and, eq } from "drizzle-orm";
import db from "@db";
import { qrCode } from "@db/schema";

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, "Unauthorized");
	}

	const { roomId } = await request.json();

	try {
		// Fetch all unassigned QR codes for this room
		const existingCodes = await db.query.qrCode.findMany({
			where: and(
				eq(qrCode.roomId, roomId),
				eq(qrCode.isPreGenerated, true),
				eq(qrCode.isAssigned, false),
			),
		});

		// Create PDF document
		const doc = new PDFDocument({
			size: "A4",
			margin: 10,
			autoFirstPage: true,
		});

		const chunks: Buffer[] = [];
		doc.on("data", (chunk) => chunks.push(chunk));
		const pdfComplete = new Promise<void>((resolve) => {
			doc.on("end", () => resolve());
		});

		// Calculate pagination
		const codesPerPage = 9;

		// Generate PDF for all existing codes
		for (let i = 0; i < existingCodes.length; i++) {
			const positionOnPage = i % codesPerPage;

			// Add new page when needed
			if (positionOnPage === 0 && i > 0) {
				doc.addPage();
			}

			const qrCode = existingCodes[i];

			// Generate QR code image
			const qrDataUrl = await QRCode.toDataURL(qrCode.url, {
				margin: 1,
				width: 150,
				errorCorrectionLevel: "M",
			});

			// Calculate position on page
			const row = Math.floor(positionOnPage / 3);
			const col = positionOnPage % 3;
			const xPos = col * 200 + 20;
			const yPos = row * 250 + 20;

			// Add QR code and labels to PDF
			doc.image(qrDataUrl, xPos, yPos, {
				width: 150,
				height: 150,
			});

			doc.font("Helvetica").fontSize(10);
			doc.text(`Box #${i + 1}`, xPos, yPos + 160, {
				width: 150,
				align: "center",
			});

			doc.fontSize(8);
			doc.text(qrCode.url, xPos, yPos + 175, {
				width: 150,
				align: "center",
			});
		}

		doc.end();
		await pdfComplete;

		const pdfData = Buffer.concat(chunks);
		return new Response(pdfData, {
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename="all-qr-codes.pdf"`,
			},
		});
	} catch (err) {
		console.error("Error generating QR codes PDF:", err);
		throw error(500, "Failed to generate QR codes PDF");
	}
};
