// src/routes/+layout.server.ts
import type { LayoutServerLoad } from "./$types";
import { user } from "@db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";
import db from "@db";

// Define public routes that don't require authentication
const publicRoutes = ["/login", "/register"];

export const load: LayoutServerLoad = async ({ locals, url }) => {
  // Check if current path is a public route
  const isPublicRoute = publicRoutes.some(
    (route) => url.pathname === route || url.pathname.startsWith(`${route}/`),
  );

  // If it's not a public route and user isn't authenticated, redirect to login
  if (!isPublicRoute && !locals.user) {
    throw redirect(303, "/login");
  }

  // If user is authenticated, fetch user data
  if (locals.user) {
    const USER = await db
      .select()
      .from(user)
      .where(eq(user.id, locals.user.id))
      .limit(1)
      .then((res) => res[0]);

    return {
      user: USER,
    };
  }

  // Return null for public routes without authenticated user
  return {
    user: null,
  };
};
