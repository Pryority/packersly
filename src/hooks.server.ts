// hooks.server.ts
import type { Handle } from "@sveltejs/kit";
import * as auth from "$lib/server/auth.js";
import { sequence } from "@sveltejs/kit/hooks";
// Define allowed paths that can bypass CSRF check
// const CSRF_EXEMPT_PATHS = [
//   // Add any paths that should bypass CSRF checks
//   // '/api/webhook', // example
// ];

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
  const forbidden =
    // Only check POST, PUT, PATCH, DELETE requests
    ["POST", "PUT", "PATCH", "DELETE"].includes(event.request.method) &&
    // that have form content type
    isFormContentType(event.request);
  // and aren't in exempt paths
  // !CSRF_EXEMPT_PATHS.includes(event.url.pathname);

  if (forbidden) {
    const origin = event.request.headers.get("origin");
    const host = event.request.headers.get("host");

    // Log for debugging
    console.log("CSRF Check:", {
      method: event.request.method,
      path: event.url.pathname,
      origin,
      host,
      headers: {
        "content-type": event.request.headers.get("content-type"),
        "x-forwarded-proto": event.request.headers.get("x-forwarded-proto"),
        "x-forwarded-host": event.request.headers.get("x-forwarded-host"),
      },
    });

    // Check if origin matches host (allowing for HTTP/HTTPS)
    if (origin) {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        const message = `Cross-site ${event.request.method} form submissions are forbidden`;

        // Return JSON or text based on Accept header
        if (event.request.headers.get("accept") === "application/json") {
          return new Response(JSON.stringify({ message }), {
            status: 403,
            headers: { "content-type": "application/json" },
          });
        }
        return new Response(message, { status: 403 });
      }
    }
  }

  return resolve(event);
};

// Your existing auth handler
const handleAuth: Handle = async ({ event, resolve }) => {
  // Your existing auth logic
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

// Combine handlers using sequence
export const handle = sequence(csrfProtect, handleAuth);

// const handleAuth: Handle = async ({ event, resolve }) => {
//   // Console log for debugging
//   console.log("Request Details:", {
//     url: event.url.toString(),
//     host: event.url.host,
//     protocol: event.url.protocol,
//     headers: {
//       origin: event.request.headers.get("origin"),
//       host: event.request.headers.get("host"),
//       "x-forwarded-host": event.request.headers.get("x-forwarded-host"),
//       "x-forwarded-proto": event.request.headers.get("x-forwarded-proto"),
//     },
//   });
//   // Your existing auth logic
//   const sessionToken = event.cookies.get(auth.sessionCookieName);
//   if (!sessionToken) {
//     console.log("No session token found");
//     event.locals.user = null;
//     event.locals.session = null;
//     return resolve(event);
//   }

//   const { session, user } = await auth.validateSessionToken(sessionToken);
//   if (session) {
//     console.log("Valid session found for user:", user?.username);
//     auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
//   } else {
//     console.log("Invalid session, clearing cookie");
//     auth.deleteSessionTokenCookie(event);
//   }
//   event.locals.user = user;
//   event.locals.session = session;

//   return resolve(event);
// };

// export const handle: Handle = handleAuth;
