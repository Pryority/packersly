// src/lib/server/zod/index.ts
export { default as projectSchema, type ProjectSchema } from "./projectSchema";
export { default as roomSchema, type RoomSchema } from "./roomSchema";
export {
  default as registerSchema,
  type RegisterSchema,
} from "./registerSchema";
export { default as loginSchema } from "./loginSchema";
export { default as itemSchema, type ItemSchema } from "./itemSchema";
export { default as boxSchema, type BoxSchema } from "./boxSchema";
export {
  default as downloadQrSchema,
  type DownloadQrSchema,
} from "./downloadQrSchema";
export {
  default as generateQrSchema,
  type GenerateQrSchema,
} from "./generateQrSchema";
