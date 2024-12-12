// hooks.server.ts
import type { Handle } from "@sveltejs/kit";
import * as auth from "$lib/server/auth.js";

const handleAuth: Handle = async ({ event, resolve }) => {
  console.log("Request Details:", {
    url: event.url.toString(),
    host: event.url.host,
    protocol: event.url.protocol,
    origin: event.url.origin,
    pathname: event.url.pathname,
    headers: {
      origin: event.request.headers.get("origin"),
      host: event.request.headers.get("host"),
      "x-forwarded-host": event.request.headers.get("x-forwarded-host"),
      "x-forwarded-proto": event.request.headers.get("x-forwarded-proto"),
    },
  });

  // Handle auth session
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
