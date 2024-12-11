// src/routes/project/[handle]/room/[handle]/box/[id]/+page.server.ts
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import db from "@db";
import { box } from "@db/schema";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.user) {
    throw redirect(302, "/login");
  }

  const BOX = await db.query.box.findFirst({
    where: eq(box.id, params.id),
    with: {
      items: true,
      room: true, // Include room data if needed
    },
  });

  if (!BOX) {
    throw redirect(302, "/dashboard"); // or handle "box not found" differently
  }

  return {
    box: BOX,
  };
};
