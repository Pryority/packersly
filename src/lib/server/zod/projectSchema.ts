// src/lib/schemas/project.ts
import { z } from "zod";
import roomSchema from "./roomSchema";

const projectSchema = z.object({
  name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(50, "Project name must be less than 50 characters"),
  fromAddress: z
    .string()
    .min(5, "Current address is too short")
    .max(100, "Current address is too long"),
  toAddress: z
    .string()
    .min(5, "New address is too short")
    .max(100, "New address is too long"),
  rooms: z
    .array(roomSchema)
    .min(1, "At least one room is required")
    .max(20, "Maximum 20 rooms allowed"),
});

export type ProjectSchema = z.infer<typeof projectSchema>;
export default projectSchema;
