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
    const contentType = event.request.headers.get("content-type");
    const origin = event.request.headers.get("origin");
    const host = event.request.headers.get("host");

    // Debug logging
    console.log("CSRF Check Details:", {
      method,
      contentType,
      origin,
      host,
      path: event.url.pathname,
      headers: {
        "x-forwarded-proto": event.request.headers.get("x-forwarded-proto"),
        "x-forwarded-host": event.request.headers.get("x-forwarded-host"),
      },
    });

    // Check if this is a form submission that needs CSRF protection
    if (
      ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
      isFormContentType(event.request)
    ) {
      // If there's no origin header, allow the request (same-origin requests)
      if (!origin) {
        return resolve(event);
      }

      // If there is an origin, check if it matches
      const originUrl = new URL(origin);
      const hostUrl = new URL(`https://${host}`); // Assume HTTPS for Railway

      console.log("Comparing origins:", {
        originHost: originUrl.host,
        requestHost: hostUrl.host,
      });

      if (originUrl.host !== hostUrl.host) {
        const message = `Cross-site ${method} form submissions are forbidden`;
        if (event.request.headers.get("accept") === "application/json") {
          return new Response(JSON.stringify({ message }), {
            status: 403,
            headers: { "content-type": "application/json" },
          });
        }
        return new Response(message, { status: 403 });
      }
    }

    return resolve(event);
  } catch (error) {
    console.error("CSRF Protection Error:", error);

    // Return a JSON error response
    return new Response(
      JSON.stringify({
        message: "Error processing request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
};

// Your existing auth handler
const handleAuth: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get(auth.sessionCookieName);
  if (!sessionToken) {
    console.log("No session token found");
    event.locals.user = null;
    event.locals.session = null;
    return resolve(event);
  }

  const { session, user } = await auth.validateSessionToken(sessionToken);
  if (session) {
    console.log("Valid session found for user:", user?.username);
    auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
  } else {
    console.log("Invalid session, clearing cookie");
    auth.deleteSessionTokenCookie(event);
  }
  event.locals.user = user;
  event.locals.session = session;

  return resolve(event);
};

export const handle = sequence(csrfProtect, handleAuth);
