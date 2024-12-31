// src/routes/settings/zod/boxSchema.ts
import { z } from "zod";
import itemSchema from "./itemSchema";

const boxSchema = z.object({
  boxId: z.string().uuid(),
  items: z
    .array(itemSchema)
    .optional()
    .default([{ id: "", name: "", quantity: 1 }]),
});

export type BoxSchema = typeof boxSchema;
export default boxSchema;
