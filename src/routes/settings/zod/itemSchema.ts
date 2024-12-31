// src/routes/settings/zod/itemSchema.ts
import { z } from "zod";

const itemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(2, "Item name must be at least 2 characters")
    .max(256, "Item name must be less than 50 characters"),
  quantity: z.number().default(1),
});

export type ItemSchema = typeof itemSchema;
export default itemSchema;
