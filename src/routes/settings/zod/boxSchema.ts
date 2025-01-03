// src/routes/settings/zod/boxSchema.ts
import { z } from "zod";
import itemSchema from "./itemSchema";

const qrCodeSchema = z
  .object({
    id: z.string().uuid(),
    url: z.string(),
    isAssigned: z.boolean(),
  })
  .optional()
  .nullable();

const boxSchema = z.object({
  boxId: z.string().uuid().optional(),
  items: z
    .array(itemSchema)
    .min(1, "At least one item is required")
    .default([{ name: "", quantity: 1 }]),
  notes: z.string().optional().nullable(),
  qrCode: qrCodeSchema,
});

export type BoxSchema = typeof boxSchema;
export default boxSchema;
