// src/routes/settings/zod/roomSchema.ts
import { z } from "zod";

const roomSchema = z.object({
  name: z
    .string()
    .min(2, "Must be at least 2 characters")
    .max(30, "Must be less than 30 characters"),
  colorCode: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color code")
    .default("#000000"),
});

export type RoomSchema = typeof roomSchema;
export default roomSchema;
