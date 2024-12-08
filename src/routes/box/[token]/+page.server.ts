// src/routes/box/[token]/+page.server.ts
import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { verifyBoxAccess } from "@server/db/helpers";

export const load: PageServerLoad = async ({ params, locals }) => {
  const { token } = params;

  try {
    // Get user ID from your custom session
    const userId = locals.user?.id;

    const boxData = await verifyBoxAccess(token, userId);

    // If not logged in and box requires auth, redirect to login
    if (!boxData.isPublic && !locals.user) {
      throw redirect(302, `/login?redirect=/box/${token}`);
    }

    return {
      box: boxData,
      user: locals.user,
    };
  } catch (e) {
    if (e instanceof redirect) throw e;
    throw error(403, "Unauthorized access");
  }
};
