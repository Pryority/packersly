// src/lib/server/db/migrate.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import env from "../../env";
import { sql } from "drizzle-orm";

async function runMigrations() {
  const migrationClient = postgres(env.DATABASE_URL, {
    max: 1,
    ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });

  try {
    const db = drizzle(migrationClient, { schema });
    console.log("Running migrations...");
    // Run your migrations
    await db.execute(sql`SELECT 1`); // Test query
    console.log("Migrations completed");
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  } finally {
    await migrationClient.end();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
