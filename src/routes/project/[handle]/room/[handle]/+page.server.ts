// src/routes/project/[handle]/room/[handle]/+page.server.ts
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import db from "@db";
import { box, room } from "@db/schema";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async ({ locals, url, params }) => {
  if (!locals.user) {
    throw redirect(302, "/login");
  }

  // Use the room handle from params instead of trying to parse URL
  const roomHandle = params.handle;

  // First get the room by its handle
  const ROOM = await db.query.room.findFirst({
    where: eq(room.handle, roomHandle),
    with: {
      boxes: {
        with: {
          items: true,
        },
      },
    },
  });

  if (!ROOM) {
    throw redirect(302, "/dashboard"); // or handle the "room not found" case differently
  }

  console.log("[Room Handle Page Server] Load Data:", { ROOM });

  return {
    room: ROOM,
    boxes: ROOM.boxes,
  };
};
