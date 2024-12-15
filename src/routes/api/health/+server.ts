// src/routes/health/+server.ts
import db from "@db";

export async function GET() {
  const start = performance.now();

  try {
    // Quick DB check
    await db.query.project.findFirst({
      columns: { id: true },
    });

    const duration = performance.now() - start;
    return new Response("OK", {
      status: 200,
      headers: {
        "Cache-Control": "no-cache",
        "Server-Timing": `total;dur=${duration.toFixed(2)}`,
      },
    });
  } catch (error) {
    console.error("Healthcheck failed:", error);
    return new Response("ERROR", { status: 500 });
  }
}
