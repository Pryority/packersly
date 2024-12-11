import * as auth from "@server/auth";
import { type Actions, fail, redirect } from "@sveltejs/kit";

export const actions: Actions = {
  default: async (event) => {
    if (!event.locals.session) {
      console.log("Logout failed: No session found");
      return fail(401);
    }

    console.log("Logging out user:", event.locals.user?.username);
    await auth.invalidateSession(event.locals.session.id);
    auth.deleteSessionTokenCookie(event);

    // Clear locals explicitly
    event.locals.user = null;
    event.locals.session = null;

    console.log("User logged out successfully");
    return redirect(302, "/login");
  },
};
