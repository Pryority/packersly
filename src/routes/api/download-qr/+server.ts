// src/routes/api/download-qr/+server.ts
import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { qrCode, colorCode } = data;

    // Parse the original SVG to get its viewBox
    const viewBoxMatch = qrCode.match(/viewBox="([^"]+)"/);
    const [x, y, width, height] = (viewBoxMatch?.[1] || "0 0 100 100")
      .split(" ")
      .map(Number);

    // Calculate dimensions for the color bar
    const padding = width * 0.1;
    const barHeight = height * 0.2;
    const gap = height * 0.05;
    const newHeight = height + gap + barHeight;

    // Create the new SVG with color bar
    const modifiedSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${width} ${newHeight}">
        <rect x="${x}" y="${y}" width="${width}" height="${newHeight}" fill="white"/>
        ${qrCode.replace(/<svg[^>]*>|<\/svg>/g, "")}
        <rect
          x="${x + padding}"
          y="${height + gap}"
          width="${width - padding * 2}"
          height="${barHeight}"
          fill="${colorCode}"
          rx="${barHeight * 0.1}"
        />
      </svg>
    `;

    return new Response(modifiedSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": 'attachment; filename="box-qr-code.svg"',
      },
    });
  } catch (err) {
    throw error(500, "Failed to generate QR code");
  }
};
