// src/routes/settings/zod/downloadQrSchema.ts
import { z } from "zod";

const downloadQrSchema = z.object({
  roomId: z.string().uuid(),
});

export type DownloadQrSchema = typeof downloadQrSchema;
export default downloadQrSchema;
