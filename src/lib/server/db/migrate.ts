import db, { connection } from "@db";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function runMigrations() {
  console.log("Running migrations...");

  await migrate(db, { migrationsFolder: "./drizzle" });

  console.log("Migrations completed");

  await connection.end();
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
