// src/hooks.server.ts
import { sequence } from "@sveltejs/kit/hooks";
import type { Handle } from "@sveltejs/kit";
import * as auth from "$lib/server/auth.js";
import { sessionCache } from "$lib/server/auth.js";

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

const handleTiming: Handle = async ({ event, resolve }) => {
  const requestStart = performance.now();
  const requestId = crypto.randomUUID();

  console.log({
    event: "RequestStart",
    requestId,
    path: event.url.pathname,
    timestamp: new Date().toISOString(),
  });

  try {
    const response = await resolve(event);
    const duration = performance.now() - requestStart;

    console.log({
      event: "RequestComplete",
      requestId,
      path: event.url.pathname,
      duration: `${duration.toFixed(2)}ms`,
      timestamp: new Date().toISOString(),
      status: response.status,
    });

    // Add timing header
    response.headers.set("Server-Timing", `total;dur=${duration.toFixed(2)}`);
    return response;
  } catch (error) {
    console.error({
      event: "RequestError",
      requestId,
      path: event.url.pathname,
      duration: `${(performance.now() - requestStart).toFixed(2)}ms`,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

const handleCompression: Handle = async ({ event, resolve }) => {
  const start = performance.now();
  const timings: Record<string, number> = {};

  try {
    const response = await resolve(event);
    timings.resolve = performance.now() - start;

    if (event.url.pathname.endsWith("__data.json")) {
      const compressStart = performance.now();
      const originalBody = await response.text();
      timings.getText = performance.now() - compressStart;

      const acceptEncoding = event.request.headers.get("accept-encoding") || "";

      if (acceptEncoding.includes("gzip")) {
        const compressStart = performance.now();
        const compressed = Bun.gzipSync(Buffer.from(originalBody));
        timings.compression = performance.now() - compressStart;

        const newResponse = new Response(compressed, {
          headers: {
            ...Object.fromEntries(response.headers),
            "content-encoding": "gzip",
            "content-type": "application/json",
            vary: "Accept-Encoding",
            "timing-info": JSON.stringify(timings),
          },
        });

        console.log("Compression timings:", {
          path: event.url.pathname,
          originalSize: originalBody.length,
          compressedSize: compressed.length,
          ...timings,
        });

        return newResponse;
      }
    }

    return response;
  } catch (error) {
    console.error("Compression error:", error, {
      path: event.url.pathname,
      timings,
    });
    return resolve(event);
  }
};

// Your existing auth handler
const handleAuth: Handle = async ({ event, resolve }) => {
  const start = performance.now();

  try {
    const sessionToken = event.cookies.get(auth.sessionCookieName);
    if (!sessionToken) {
      event.locals.user = null;
      event.locals.session = null;
      return resolve(event);
    }

    try {
      const validationStart = performance.now();
      const { session, user } = await auth.validateSessionToken(sessionToken);
      const validationDuration = performance.now() - validationStart;

      if (validationDuration > 100) {
        console.log("Slow session validation:", {
          duration: validationDuration,
          path: event.url.pathname,
          cached: !!sessionCache.get(sessionToken),
        });
      }

      if (session) {
        auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
      } else {
        auth.deleteSessionTokenCookie(event);
      }
      event.locals.user = user;
      event.locals.session = session;
    } catch (authError) {
      console.error("Auth validation error:", {
        error: authError,
        duration: performance.now() - start,
      });
      event.locals.user = null;
      event.locals.session = null;
      auth.deleteSessionTokenCookie(event);
    }

    return resolve(event);
  } catch (error) {
    console.error("Hook error:", {
      error,
      duration: performance.now() - start,
    });
    return resolve(event);
  }
};

export const handle = sequence(
  handleCompression,
  handleTiming,
  csrfProtect,
  handleAuth,
);
