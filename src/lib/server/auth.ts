// auth.ts
import type { RequestEvent } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase64url, encodeHexLowerCase } from "@oslojs/encoding";
import * as table from "@db/schema";
import type { Session } from "@db/schema/session";
import db from "@db";

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = "auth-session";
type ValidatedSession = {
  session: Session | null;
  user: {
    id: string;
    username: string;
  } | null;
};
export const sessionCache = new Map<
  string,
  {
    data: ValidatedSession;
    timestamp: number;
  }
>();
const SESSION_CACHE_TTL = 60 * 1000; // 1 minute

export function generateSessionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  const token = encodeBase64url(bytes);
  return token;
}

export async function createSession(token: string, userId: string) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session: Session = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + DAY_IN_MS * 30),
  };
  await db.insert(table.session).values(session);
  return session;
}

export async function validateSessionToken(
  token: string,
): Promise<ValidatedSession> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

  // Update cache type
  const cached = sessionCache.get(sessionId);
  const now = Date.now();
  if (cached && now - cached.timestamp < SESSION_CACHE_TTL) {
    if (cached.data.session && now >= cached.data.session.expiresAt.getTime()) {
      sessionCache.delete(sessionId);
      return { session: null, user: null };
    } else {
      return cached.data;
    }
  }

  const [result] = await db
    .select({
      user: { id: table.user.id, username: table.user.username },
      session: table.session,
    })
    .from(table.session)
    .innerJoin(table.user, eq(table.session.userId, table.user.id))
    .where(eq(table.session.id, sessionId));

  if (!result) {
    return { session: null, user: null };
  }

  const { session, user } = result;
  if (now >= session.expiresAt.getTime()) {
    await db.delete(table.session).where(eq(table.session.id, session.id));
    return { session: null, user: null };
  }

  const renewSession = now >= session.expiresAt.getTime() - DAY_IN_MS * 15;
  if (renewSession) {
    session.expiresAt = new Date(now + DAY_IN_MS * 30);
    await db
      .update(table.session)
      .set({ expiresAt: session.expiresAt })
      .where(eq(table.session.id, session.id));
  }

  const validationResult: ValidatedSession = { session, user };
  sessionCache.set(sessionId, {
    data: validationResult,
    timestamp: now,
  });

  return validationResult;
}

export type SessionValidationResult = ValidatedSession;

// Add cache invalidation on logout
export async function invalidateSession(sessionId: string) {
  sessionCache.delete(sessionId);
  try {
    const result = await db
      .delete(table.session)
      .where(eq(table.session.id, sessionId))
      .returning({ id: table.session.id });
    return result.length > 0;
  } catch (error) {
    console.error("Error invalidating session:", error);
    throw error;
  }
}

export function setSessionTokenCookie(
  event: RequestEvent,
  token: string,
  expiresAt: Date,
) {
  event.cookies.set(sessionCookieName, token, {
    expires: expiresAt,
    path: "/",
    // Add these settings for better iOS compatibility
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

export function deleteSessionTokenCookie(event: RequestEvent) {
  event.cookies.delete(sessionCookieName, {
    path: "/",
  });
}
