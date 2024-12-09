import db from "@db";
import * as table from "@db/schema";
import { verify } from "argon2";
import * as auth from "@server/auth";
import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { Actions } from "./$types";
import { loginSchema } from "@server/zod";

export const actions: Actions = {
  login: async (event) => {
    const formData = Object.fromEntries(await event.request.formData());
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return fail(400, {
        error: errors,
        data: formData,
      });
    }
    if (
      typeof result.data.email !== "string" ||
      !result.data.email.includes("@")
    ) {
      return fail(400, { error: "Invalid email" });
    }
    if (!validatePassword(result.data.password)) {
      return fail(400, { error: "Invalid password" });
    }

    const results = await db
      .select()
      .from(table.user)
      .where(eq(table.user.email, result.data.email));

    const existingUser = results.at(0);
    if (!existingUser) {
      return fail(400, { error: "Incorrect email or password" });
    }

    const validPassword = await verify(
      existingUser.passwordHash,
      result.data.password,
    );
    if (!validPassword) {
      return fail(400, { error: "Incorrect email or password" });
    }

    const sessionToken = auth.generateSessionToken();
    const session = await auth.createSession(sessionToken, existingUser.id);
    auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

    return redirect(302, "/dashboard");
  },
};

function validatePassword(password: unknown): password is string {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 255
  );
}
