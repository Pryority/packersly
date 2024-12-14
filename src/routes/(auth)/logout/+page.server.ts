import * as auth from "@server/auth";
import { type Actions, fail, redirect } from "@sveltejs/kit";

export const actions: Actions = {
  default: async (event) => {
    try {
      if (!event.locals.session) {
        console.log("Logout attempt with no active session");
        // Still delete the cookie just in case
        auth.deleteSessionTokenCookie(event);
        return redirect(302, "/login");
      }

      const sessionId = event.locals.session.id;
      const username = event.locals.user?.username;

      console.log("Starting logout for user:", username);

      try {
        await auth.invalidateSession(sessionId);
        console.log("Session invalidated successfully:", sessionId);
      } catch (dbError) {
        console.error("Error invalidating session:", dbError);
        // Continue with logout even if DB cleanup fails
      }

      // Clear session cookie
      auth.deleteSessionTokenCookie(event);

      // Clear locals
      event.locals.user = null;
      event.locals.session = null;

      console.log("Logout completed for user:", username);

      // Add cache control headers to prevent back-button issues
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/login",
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    } catch (error) {
      console.error("Unexpected error during logout:", error);
      // Still try to clean up
      auth.deleteSessionTokenCookie(event);
      return redirect(302, "/login");
    }
  },
};
