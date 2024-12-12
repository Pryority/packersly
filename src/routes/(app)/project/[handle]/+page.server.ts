// src/routes/dashboard/[handle]/+page.server.ts
import {
  error,
  fail,
  redirect,
  type Actions,
  type Redirect,
} from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import db from "@db";
import { project, room } from "@db/schema";
import { and, eq } from "drizzle-orm";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { roomSchema } from "@routes/settings/zod";
import { generateHandle } from "@utils";

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.user) {
    throw redirect(302, "/login");
  }

  // console.log(url);

  // const urlPathname = url.pathname; // "/project/the-big-move"
  // const pathSegments = urlPathname.split("/");
  // const projectHandle = pathSegments[pathSegments.length - 1]; // "the-big-move"
  const PROJECT = await db.query.project.findFirst({
    where: and(
      eq(project.handle, params.handle),
      eq(project.userId, locals.user.id),
    ),
    with: {
      rooms: {
        with: {
          boxes: true,
        },
      },
    },
  });

  console.log("[Project Handle Page Server] Load Data:", { PROJECT });

  return {
    project: PROJECT,
    form: await superValidate(zod(roomSchema)),
  };
};

export const actions = {
  "create-room": async ({ locals, request, params, url }) => {
    console.log("Action started");
    if (!locals.user) {
      throw error(401, "Unauthorized");
    }

    const form = await superValidate(request, zod(roomSchema));
    console.log("Form data received:", form.data);
    if (!form.valid) {
      console.log("Form validation failed:", form.errors);
      return fail(400, { form });
    }

    try {
      const handle = params.handle;
      if (!handle) {
        return fail(400, {
          form,
          message: "Project handle is required",
        });
      }

      // First get the project (not room) to verify ownership
      const PROJECT = await db.query.project.findFirst({
        where: eq(project.handle, handle),
        columns: {
          id: true,
          userId: true,
        },
      });

      if (!PROJECT) {
        return fail(404, {
          form,
          message: "Project not found",
        });
      }

      // Verify user owns the project
      if (PROJECT.userId !== locals.user.id) {
        throw error(
          403,
          "You don't have permission to create rooms in this project",
        );
      }

      // Use a transaction to ensure all operations succeed or fail together
      const newRoom = await db.transaction(async (tx) => {
        const roomId = crypto.randomUUID();
        const roomHandle = generateHandle(form.data.name); // Make sure to import generateHandle

        // Create the room
        const [createdRoom] = await tx
          .insert(room)
          .values({
            id: roomId,
            projectId: PROJECT.id,
            name: form.data.name,
            handle: roomHandle,
            colorCode: form.data.colorCode,
            boxCount: 0, // Initialize counters
            itemCount: 0,
          })
          .returning();

        return createdRoom;
      });

      // Redirect to the room view page
      throw redirect(303, `/project/${handle}/room/${newRoom.handle}`);
    } catch (error) {
      if (error as Redirect) {
        throw error; // Re-throw redirect
      }
      console.error("Room Creation error:", error);
      return fail(500, {
        form,
        message: "An error occurred during room creation",
      });
    }
  },
} satisfies Actions;
