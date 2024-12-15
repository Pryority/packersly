// src/lib/server/db/migrate.ts
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import env from "../../env";
import pkg from "pg";
const { Pool } = pkg;
async function runMigrations() {
  const migrationPool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 1,
    ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 10000,
  });

  try {
    drizzle(migrationPool, { schema });
    console.log("Migrations completed");
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  } finally {
    await migrationPool.end();
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
