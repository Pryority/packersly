// src/routes/register/+page.server.ts
import { fail, redirect, type Redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { hash } from "argon2";
import db from "@db";
import * as table from "@db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { registerSchema } from "@server/zod";
import * as auth from "@server/auth";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    return redirect(303, "/dashboard");
  }
  return {
    form: await superValidate(zod(registerSchema)),
  };
};

export const actions: Actions = {
  register: async (event) => {
    // Keep the entire event object
    const form = await superValidate(event, zod(registerSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const existingUser = await db.query.user.findFirst({
        where: eq(table.user.email, form.data.email),
      });

      if (existingUser) {
        return fail(400, {
          error: { email: "Email already registered" },
          email: form.data.email,
        });
      }

      const userId = generateId();

      // Create user
      const [user] = await db
        .insert(table.user)
        .values({
          id: userId,
          username: form.data.email,
          email: form.data.email,
          passwordHash: await hash(form.data.password),
          firstName: form.data.firstName,
          lastName: form.data.lastName,
          userType: "client",
        })
        .returning();

      if (user) {
        const sessionToken = auth.generateSessionToken();
        const session = await auth.createSession(sessionToken, userId);
        auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

        // Use 303 redirect for POST requests
        throw redirect(303, "/dashboard");
      }
    } catch (error) {
      if (error as Redirect) {
        throw error; // Re-throw redirect
      }
      console.error("Registration error:", error);
      return fail(500, {
        form,
        error: "An error occurred during registration",
      });
    }
  },
};

function generateId(): string {
  return randomBytes(12).toString("base64url");
}
