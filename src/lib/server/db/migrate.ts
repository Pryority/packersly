import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as schema from "./schema";
import env from "../../env";
import pkg from "pg";
import {
  addConsistencyConstraints,
  fixBoxStates,
} from "./fix-box-state-migration";
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
    const db = drizzle(migrationPool, { schema });
    // Run migrations first
    await migrate(db, { migrationsFolder: "drizzle" });
    console.log("Migrations completed");

    // Then run the fixes
    await fixBoxStates();
    await addConsistencyConstraints();
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
