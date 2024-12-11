// src/lib/schemas/room.ts
import { z } from "zod";

const roomSchema = z.object({
  name: z
    .string()
    .min(2, "Room name must be at least 2 characters")
    .max(30, "Room name must be less than 30 characters"),
  colorCode: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color code"),
});

export type RoomFormData = z.infer<typeof roomSchema>;
export default roomSchema;
