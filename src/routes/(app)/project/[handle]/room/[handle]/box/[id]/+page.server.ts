// src/routes/project/[handle]/room/[handle]/box/[id]/+page.server.ts
import { error, redirect, fail, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import db from "@db";
import { box } from "@db/schema";
import { eq } from "drizzle-orm";
import { downloadQrSchema } from "@routes/settings/zod";
import { zod } from "sveltekit-superforms/adapters";
import { superValidate } from "sveltekit-superforms";

export const load: PageServerLoad = async ({ locals, params, url }) => {
  if (!locals.user) {
    throw redirect(302, "/login");
  }

  // First, get the box with its relationships
  const BOX = await db.query.box.findFirst({
    where: eq(box.id, params.id),
    with: {
      items: true,
      room: {
        with: {
          project: {
            columns: {
              id: true,
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!BOX) {
    throw error(404, "Box not found");
  }

  // Get access token from query parameter if it exists
  const accessToken = url.searchParams.get("token");

  // Check if the user has access to this box
  const hasAccess =
    // User owns the project
    BOX.room.project.userId === locals.user.id ||
    // Or the box is public (if you want to keep this option)
    BOX.isPublic ||
    // Or user has explicit access through a shared link (optional)
    (accessToken && BOX.accessToken === accessToken);

  if (!hasAccess) {
    throw error(403, "You don't have permission to view this box");
  }

  return {
    box: {
      ...BOX,
      // Only include access token if user owns the project
      accessToken:
        BOX.room.project.userId === locals.user.id
          ? BOX.accessToken
          : undefined,
    },
    form: await superValidate(zod(downloadQrSchema)),
  };
};
export const actions = {
  download: async ({ request }) => {
    const form = await superValidate(request, zod(downloadQrSchema));
    if (!form.valid) {
      return fail(400, { form });
    }
    return { success: true };
  },
} satisfies Actions;
