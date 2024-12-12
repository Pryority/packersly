// hooks.server.ts
import type { Handle } from "@sveltejs/kit";
import * as auth from "$lib/server/auth.js";

const handleAuth: Handle = async ({ event, resolve }) => {
  // Force set the protocol and origin based on Railway's forwarded headers
  const forwardedProto = event.request.headers.get("x-forwarded-proto");
  const host = event.request.headers.get("host");

  if (forwardedProto && host) {
    const expectedOrigin = `${forwardedProto}://${host}`;

    // Create a new request with the correct origin if it's missing
    if (!event.request.headers.get("origin")) {
      const newHeaders = new Headers(event.request.headers);
      newHeaders.set("origin", expectedOrigin);

      event.request = new Request(event.request.url, {
        method: event.request.method,
        headers: newHeaders,
        body: event.request.body,
        credentials: event.request.credentials,
      });
    }

    // Also update the URL protocol
    event.url.protocol = forwardedProto + ":";
  }

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

export const handle: Handle = handleAuth;
