import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "$env/dynamic/private";
import * as schema from "./schema";

export const connection = postgres(env.DATABASE_URL, {
  max: env.DB_MIGRATING || env.DB_SEEDING ? 1 : undefined,
  onnotice: env.DB_SEEDING ? () => {} : undefined,
  ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

const db = drizzle(connection, { schema, logger: true });

export type DB = typeof db;
export default db;
