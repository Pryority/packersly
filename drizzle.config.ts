import { defineConfig } from "drizzle-kit";
import env from "./src/lib/env";

export default defineConfig({
  schema: "./src/lib/server/db/schema",

  dbCredentials: {
    url: env.DATABASE_URL,
  },

  verbose: true,
  strict: true,
  dialect: "postgresql",
});
