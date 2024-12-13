// src/lib/server/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import env from "../../env";
import { config } from "dotenv";
import { expand } from "dotenv-expand";

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    timestamp: new Date().toISOString(),
  });
});

const myEnv = config({ path: ".env" });
expand(myEnv);

const connectionConfig = {
  max: env.DB_MIGRATING || env.DB_SEEDING ? 1 : 15, // Increased max connections
  onnotice: env.DB_SEEDING ? () => {} : undefined,
  ssl: {
    rejectUnauthorized: true, // Stricter SSL
    ca: process.env.DATABASE_CA_CERT, // If Railway provides a CA cert
  },
  idle_timeout: 30, // Reduced from 60 to 30 seconds
  connect_timeout: 20, // Reduced from 30 to 20 seconds
  keepalive: true,
  max_lifetime: 15 * 60, // Reduced connection lifetime to 15 minutes
  statement_timeout: 5 * 1000, // Reduced to 5 seconds
  application_name: "PackerslyApp", // Helps in connection tracking
  onconnect: () => {
    console.log("Database connection established", {
      timestamp: new Date().toISOString(),
    });
  },
  onclose: () => {
    console.error("Database connection closed unexpectedly", {
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
            console.log("DB Query:", {
              query,
              params,
              timestamp: new Date().toISOString(),
            });
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
