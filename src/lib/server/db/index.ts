// src/lib/server/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import env from "../../env";
import { config } from "dotenv";
import { expand } from "dotenv-expand";

const myEnv = config({ path: ".env" });
expand(myEnv);

const connectionConfig = {
  // max: env.DB_MIGRATING || env.DB_SEEDING ? 1 : 10,
  max: env.NODE_ENV === "production" ? 50 : 10,
  onnotice: env.DB_SEEDING ? () => {} : undefined,
  ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  idle_timeout: 60, // Increased from 20 to 60 seconds
  connect_timeout: 30, // Increased from 20 to 30 seconds
  keepalive: true,
  max_lifetime: 60 * 30, // Maximum connection lifetime (30 minutes)
  statement_timeout: 10 * 1000, // 10 seconds timeout for individual statements
  onconnect: () => {
    console.log("Database connection established");
  },
  onclose: () => {
    console.log("Database connection closed");
  },
};

export const connection = postgres(env.DATABASE_URL, connectionConfig);

const db = drizzle(connection, {
  schema,
  logger:
    env.NODE_ENV === "development"
      ? {
          logQuery: (query, params) => {
            // console.log("DB Query:", {
            //   query,
            //   params,
            //   timestamp: new Date().toISOString(),
            // });
          },
        }
      : false,
});

// Global error handler for unhandled promises
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

export type DB = typeof db;
export default db;
