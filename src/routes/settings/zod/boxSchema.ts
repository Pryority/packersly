// src/routes/settings/zod/boxSchema.ts
import { z } from "zod";
import itemSchema from "./itemSchema";

const boxSchema = z.object({
  items: z.array(itemSchema).optional(),
});

export type BoxSchema = typeof boxSchema;
export default boxSchema;
