// src/routes/settings/zod/generateQrSchema.ts
import { z } from "zod";

const generateQrSchema = z.object({
  roomId: z.string().uuid(),
  count: z.number(),
});

export type GenerateQrSchema = typeof generateQrSchema;
export default generateQrSchema;
