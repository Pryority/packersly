import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import env from "../../env";
import pkg from "pg";
const { Pool } = pkg;
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  min: 2,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 15000,
});

pool.on("connect", () => {
  console.log("New database connection established", new Date().toISOString());
});

pool.on("error", (err) => {
  console.error("Unexpected database error:", err);
});

const db = drizzle(pool, { schema });

export default db;
