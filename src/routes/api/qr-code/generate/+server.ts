import db from "@db";
import PDFDocument from "pdfkit";
import { qrCode } from "@db/schema";
import { error, type RequestHandler } from "@sveltejs/kit";
import QRCode from "qrcode";

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, "Unauthorized");
	}

	const { roomId, count } = await request.json();

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

		const qrCodes = await db.transaction(async (tx) => {
			const codes = [];

			const codesPerPage = 9;

			// Generate all QR codes in a batch
			for (var i = 0; i < count; i++) {
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
				const boxUrl = new URL(`/box/${boxId}`, baseUrl);
				boxUrl.searchParams.set("token", accessToken);

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
				doc.text(boxUrl.toString(), xPos, yPos + 175, {
					width: 150,
					align: "center",
				});
				doc.fontSize(8);
			}

			return codes;
		});

		// Finalize the PDF doc.end();

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
		console.error("Error generating QR codes:", err);
		throw error(500, "Failed to generate QR codes");
	}
};
