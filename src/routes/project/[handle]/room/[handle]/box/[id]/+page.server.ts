// src/routes/dashboard/[handle]/+page.server.ts
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import db from "@db";
import { room } from "@db/schema";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    throw redirect(302, "/login");
  }

  console.log(url);

  const urlPathname = url.pathname; // "/project/the-big-move"
  const pathSegments = urlPathname.split("/");
  const roomHandle = pathSegments[pathSegments.length - 1]; // "the-big-move"
  const ROOMS = await db.query.room.findMany({
    where: eq(room.handle, roomHandle),
    with: {
      boxes: true,
    },
  });

  console.log("[Room Handle Page Server] Load Data:", { ROOMS });

  return {
    rooms: ROOMS,
  };
};
