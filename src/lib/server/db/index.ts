// src/lib/server/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import env from "../../env";
import { config } from "dotenv";
import { expand } from "dotenv-expand";

const myEnv = config({ path: ".env" });
expand(myEnv);

// Create a singleton for the database connection
let db: ReturnType<typeof createDb> | null = null;

function createDb() {
  const connectionConfig = {
    max: 20,
    min: 2,
    keepalive: true,
    ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    idle_timeout: 30,
    connect_timeout: 10,
    max_lifetime: 60 * 30, // 30 minutes
    statement_timeout: 10 * 1000,
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
      // Reset the connection so it can be recreated
      db = null;
    },
  };

  const sql = postgres(env.DATABASE_URL, connectionConfig);

  return drizzle(sql, {
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
}

// Function to get database instance
function getDb() {
  if (!db) {
    db = createDb();
    console.log("Created new database connection", new Date().toISOString());
  }
  return db;
}

// Graceful shutdown handler
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Closing database connections...");
  if (db) {
    try {
      await (db as any)?.end();
      console.log("Database connections closed.");
    } catch (err) {
      console.error("Error closing database connections:", err);
    }
  }
  process.exit(0);
});

// Global error handler for unhandled promises
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Export a function that always returns the current database instance
export default getDb();
export type DB = ReturnType<typeof createDb>;
