// src/lib/schemas/register.ts
import { z } from "zod";

const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(256, "Password must less than least 256 characters"),
    confirm_password: z.string(),
    first_name: z.string().min(2, "First name is required"),
    last_name: z.string().min(2, "Last name is required"),
    user_type: z.enum(["client", "agent"]).default("client"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });
export type RegisterFormData = z.infer<typeof registerSchema>;
export default registerSchema;
