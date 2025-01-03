// src/routes/settings/zod/roomSchema.ts
import { z } from "zod";
import boxSchema from "./boxSchema";

const roomSchema = z.object({
  roomId: z.string().uuid().optional(),
  roomHandle: z.string().optional(),
  name: z
    .string()
    .min(2, "Must be at least 2 characters")
    .max(30, "Must be less than 30 characters"),
  colorCode: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color code")
    .default("#000000"),
  boxes: z.array(boxSchema).optional(),
});

export type RoomSchema = typeof roomSchema;
export default roomSchema;
