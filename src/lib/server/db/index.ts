// src/lib/server/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import env from "$lib/env";

const connectionConfig = {
  max: env.DB_MIGRATING || env.DB_SEEDING ? 1 : 10,
  onnotice: env.DB_SEEDING ? () => {} : undefined,
  ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  idle_timeout: 20,
  connect_timeout: 20,
  keepalive: true,
};

export const connection = postgres(env.DATABASE_URL, connectionConfig);

const db = drizzle(connection, {
  schema,
  logger: env.NODE_ENV === "development",
});

export type DB = typeof db;
export default db;
