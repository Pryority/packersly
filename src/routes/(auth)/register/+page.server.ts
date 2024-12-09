// src/routes/register/+page.server.ts
import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { hash } from "argon2";
import db from "@db";
import * as table from "@db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { registerSchema } from "@server/zod";
import * as auth from "@server/auth";

export const actions: Actions = {
  register: async (event) => {
    const formData = Object.fromEntries(await event.request.formData());
    console.log("Received form data:", formData);

    try {
      const result = registerSchema.safeParse(formData);
      if (!result.success) {
        console.log("Validation failed:", result.error.flatten());
        return fail(400, {
          error: result.error.flatten().fieldErrors,
          data: formData,
        });
      }

      console.log("Validation passed:", result.data);

      const existingUser = await db.query.user.findFirst({
        where: eq(table.user.email, result.data.email),
      });

      console.log("Existing user check:", existingUser);

      if (existingUser) {
        return fail(400, {
          error: { email: "Email already registered" },
          data: formData,
        });
      }

      const userId = generateId();
      const sessionToken = auth.generateSessionToken();
      console.log("Generated IDs:", { userId, sessionToken });

      // Create user
      const [user] = await db
        .insert(table.user)
        .values({
          id: userId,
          username: result.data.email,
          email: result.data.email,
          passwordHash: await hash(result.data.password),
          firstName: result.data.first_name,
          lastName: result.data.last_name,
          userType: "client",
        })
        .returning();

      console.log("User created:", user);
      console.log("Redirecting to dashboard...");

      // Return the redirect
      return redirect(302, "/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      return fail(500, {
        error: { form: "An error occurred during registration" },
        data: formData,
      });
    }
  },
};

function generateId(): string {
  return randomBytes(12).toString("base64url");
}
