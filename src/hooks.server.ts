import { sequence } from "@sveltejs/kit/hooks";
import type { Handle } from "@sveltejs/kit";
import * as auth from "$lib/server/auth.js";

// Helper to check content type
const isFormContentType = (request: Request) => {
  const type =
    request.headers.get("content-type")?.split(";", 1)[0].trim() ?? "";
  return [
    "application/x-www-form-urlencoded",
    "multipart/form-data",
    "text/plain",
  ].includes(type);
};

// CSRF protection handler
const csrfProtect: Handle = async ({ event, resolve }) => {
  try {
    const method = event.request.method;

    // Skip CSRF check for non-mutating methods
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      return resolve(event);
    }

    // Skip CSRF check for non-form content
    if (!isFormContentType(event.request)) {
      return resolve(event);
    }

    const origin = event.request.headers.get("origin");
    if (!origin) {
      return resolve(event);
    }

    const host = event.request.headers.get("host");
    if (!host) {
      console.warn("No host header found in request");
      return resolve(event);
    }

    try {
      const originUrl = new URL(origin);
      const hostUrl = new URL(`https://${host}`);

      if (originUrl.host !== hostUrl.host) {
        console.warn("CSRF check failed:", {
          originHost: originUrl.host,
          requestHost: hostUrl.host,
          path: event.url.pathname,
        });
        return new Response("Forbidden", { status: 403 });
      }
    } catch (urlError) {
      console.error("Error parsing URLs for CSRF check:", urlError);
      return resolve(event); // Continue on URL parsing error
    }

    return resolve(event);
  } catch (error) {
    console.error("CSRF Protection Error:", error);
    return resolve(event); // Continue on error rather than failing
  }
};

// Your existing auth handler
const handleAuth: Handle = async ({ event, resolve }) => {
  try {
    const sessionToken = event.cookies.get(auth.sessionCookieName);
    if (!sessionToken) {
      event.locals.user = null;
      event.locals.session = null;
      return resolve(event);
    }

    try {
      const { session, user } = await auth.validateSessionToken(sessionToken);
      if (session) {
        auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
      } else {
        auth.deleteSessionTokenCookie(event);
      }
      event.locals.user = user;
      event.locals.session = session;
    } catch (authError) {
      console.error("Auth validation error:", authError);
      event.locals.user = null;
      event.locals.session = null;
      auth.deleteSessionTokenCookie(event);
    }

    return resolve(event);
  } catch (error) {
    console.error("Hook error:", error);
    // Don't let hook errors crash the application
    return resolve(event);
  }
};

export const handle = sequence(csrfProtect, handleAuth);
