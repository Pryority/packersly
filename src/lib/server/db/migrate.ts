import db, { connection } from "./index";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import env from "$lib/env";

async function runMigrations() {
  console.log("Migration config:", {
    url: env.DATABASE_URL.replace(/:[^:/@]+@/, ":***@"), // Hide password
    migrationFolder: "./drizzle",
    env: {
      NODE_ENV: env.NODE_ENV,
      DB_HOST: env.DB_HOST,
      DB_PORT: env.DB_PORT,
    },
  });

  console.log("Running migrations...");
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations completed");
  } catch (err) {
    console.error("Migration error details:", err);
    throw err;
  } finally {
    await connection.end();
  }
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
