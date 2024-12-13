// src/routes/api/download-qr/+server.ts
import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { qrCode, colorCode } = data;

    // Parse the original SVG to get its viewBox
    const viewBoxMatch = qrCode.match(/viewBox="([^"]+)"/);
    const [x, y, width, height] = (viewBoxMatch?.[1] || "0 0 256 256")
      .split(" ")
      .map(Number);

    // Add padding for the border
    const borderWidth = width * 0.05; // 5% of width for border
    const padding = width * 0.05; // 5% of width for padding
    const totalSize = width + (padding + borderWidth) * 2;

    // Create the new SVG with border
    const modifiedSvg = `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 ${totalSize} ${totalSize}"
      >
        <rect
          x="0"
          y="0"
          width="${totalSize}"
          height="${totalSize}"
          fill="white"
        />
        <rect
          x="${borderWidth}"
          y="${borderWidth}"
          width="${totalSize - borderWidth * 2}"
          height="${totalSize - borderWidth * 2}"
          fill="white"
          stroke="${colorCode}"
          stroke-width="${borderWidth}"
          rx="${width * 0.05}"
        />
        <g transform="translate(${padding + borderWidth}, ${padding + borderWidth})">
          ${qrCode.replace(/<svg[^>]*>|<\/svg>/g, "")}
        </g>
      </svg>
    `;

    return new Response(modifiedSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": 'attachment; filename="box-qr-code.svg"',
      },
    });
  } catch (err) {
    console.error("QR Code generation error:", err);
    throw error(500, "Failed to generate QR code");
  }
};
