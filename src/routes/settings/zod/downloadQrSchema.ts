// src/routes/settings/zod/downloadQrSchema.ts
import { z } from "zod";

const downloadQrSchema = z.object({
  qrCode: z.string(),
  colorCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color code"),
});

export type DownloadQrSchema = typeof downloadQrSchema;
export default downloadQrSchema;
