// src/routes/settings/zod/boxSchema.ts
import { z } from "zod";
import itemSchema from "./itemSchema";

const boxSchema = z.object({
  boxId: z.string().uuid().optional(),
  items: z
    .array(itemSchema)
    .min(1, "At least one item is required")
    .default([{ name: "", quantity: 1 }]),
});

export type BoxSchema = typeof boxSchema;
export default boxSchema;
