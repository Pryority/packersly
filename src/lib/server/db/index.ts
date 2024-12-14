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
  max: env.NODE_ENV === "production" ? 50 : 10,
  ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  // Reduce timeouts to catch issues faster
  idle_timeout: 20, // Reduced from 60
  connect_timeout: 10, // Reduced from 30
  keepalive: 1000 * 30, // Explicit keepalive every 30 seconds
  max_lifetime: 60 * 10, // Reduced from 30 minutes to 10
  statement_timeout: 5 * 1000, // Reduced from 10 seconds to 5

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
