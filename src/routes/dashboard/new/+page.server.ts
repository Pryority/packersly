// src/routes/dashboard/new/+page.server.ts
import { error, fail, redirect } from "@sveltejs/kit";
import db from "@db";
import { project, user, room } from "@db/schema";
import type { Actions, PageServerLoad } from "./$types";
import { eq } from "drizzle-orm";
import { projectSchema } from "@server/zod";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, "/login");
  }
  return {};
};
