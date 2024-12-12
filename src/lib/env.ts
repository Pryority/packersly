import { config } from "dotenv";
import { expand } from "dotenv-expand";
import { ZodError, z } from "zod";

const stringBoolean = z.coerce
  .string()
  .transform((val: string) => {
    return val === "true";
  })
  .default("false");

const EnvSchema = z
  .object({
    NODE_ENV: z.string().default("development"),
    BASE_URL: z.string().default("http://localhost:5173"),
    // Make database fields optional if DATABASE_URL is provided
    DB_HOST: z.string().optional(),
    DB_USER: z.string().optional(),
    DB_PASSWORD: z.string().optional(),
    DB_NAME: z.string().optional(),
    DB_PORT: z.coerce.number().default(5432),
    // DATABASE_URL is the main connection string we'll use
    DATABASE_URL: z.string(),
    DB_MIGRATING: stringBoolean,
    DB_SEEDING: stringBoolean,
  })
  .refine(
    (data) => {
      // If DATABASE_URL is provided, we don't need individual DB fields
      if (data.DATABASE_URL) return true;

      // Otherwise, check if all individual fields are present
      return !!(
        data.DB_HOST &&
        data.DB_USER &&
        data.DB_PASSWORD &&
        data.DB_NAME
      );
    },
    {
      message:
        "Either DATABASE_URL or all individual DB fields must be provided",
    },
  );

export type EnvSchema = z.infer<typeof EnvSchema>;

expand(config());

try {
  EnvSchema.parse(process.env);
} catch (error) {
  if (error instanceof ZodError) {
    let message = "Missing required values in .env:\n";
    for (const issue of (error as ZodError).issues) {
      message += `${issue.path[0]}\n`;
    }
    const e = new Error(message);
    e.stack = "";
    throw e;
  }
  console.error(error);
}

export default EnvSchema.parse(process.env);
