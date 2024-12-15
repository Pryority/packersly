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
  max: 20,
  min: 2,
  idle_timeout: 60, // Increase back to 60 seconds - too short timeouts can cause unnecessary reconnections
  max_lifetime: 60 * 30, // Increase back to 30 minutes
  statement_timeout: 15000, // Increase to 15 seconds - 5 seconds might be too aggressive
  query_timeout: 10000, // 10 seconds max for queries
  keep_alive: 30 * 1000,
  ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,

  // Add more detailed error reporting
  onnotice: (notice: any) => {
    console.log("DB Notice:", notice);
  },
  onconnect: () => {
    console.log("Database connection established", new Date().toISOString());
  },
  onclose: (error: any) => {
    console.log("Database connection closed", {
      error,
      timestamp: new Date().toISOString(),
    });
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
