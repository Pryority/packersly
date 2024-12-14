// src/routes/health/+server.ts
import { json } from "@sveltejs/kit";
import db from "@db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Test database connection
    await db.execute(sql`SELECT 1`);

    return json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return new Response("Unhealthy", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}
