import db from "@db";
import { user } from "@db/schema";
import { verify } from "argon2";
import * as auth from "@server/auth";
import { fail, redirect, type Redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { loginSchema } from "@routes/settings/zod";

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    return redirect(303, "/dashboard");
  }
  return {
    form: await superValidate(zod(loginSchema)),
  };
};

export const actions: Actions = {
  login: async (event) => {
    const form = await superValidate(event, zod(loginSchema));
    if (!form.valid) {
      return fail(400, { form });
    }
    try {
      const existingUser = await db.query.user.findFirst({
        where: eq(user.email, form.data.email),
      });

      if (!existingUser) {
        return fail(400, { error: "Incorrect email or password" });
      }

      const validPassword = await verify(
        existingUser.passwordHash,
        form.data.password,
      );

      if (!validPassword) {
        return fail(400, { error: "Incorrect email or password" });
      }

      const sessionToken = auth.generateSessionToken();
      const session = await auth.createSession(sessionToken, existingUser.id);
      auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

      throw redirect(303, "/dashboard");
    } catch (error) {
      if (error as Redirect) {
        throw error; // Re-throw redirect
      }
      console.error("Login error:", error);
      return fail(500, {
        form,
        error: "An error occurred during login",
      });
    }
  },
};
