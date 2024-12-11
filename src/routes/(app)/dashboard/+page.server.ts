// src/routes/dashboard/+page.server.ts
import { error, fail, redirect, type Redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import db from "@db";
import { project, user, room } from "@db/schema";
import { eq } from "drizzle-orm";
import { generateHandle } from "@utils";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { projectSchema } from "@routes/settings/zod";
import type { ProjectData } from "@types";

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    throw redirect(302, "/login");
  }

  const projects = (await db.query.project.findMany({
    where: eq(project.userId, locals.user.id),
    with: {
      rooms: {
        with: {
          boxes: {
            with: {
              items: true, // This will return null/empty for boxes without items
            },
          },
        },
      },
    },
  })) as ProjectData[];

  // console.log("Server Load Data:", { user: locals.user, projects });

  return {
    user: locals.user,
    form: await superValidate(zod(projectSchema)),
    projects,
    showCreateProject: url.searchParams.has("new"),
  };
};

export const actions = {
  "create-project": async (event) => {
    console.log("Action started");
    if (!event.locals.user) {
      throw error(401, "Unauthorized");
    }
    const form = await superValidate(event, zod(projectSchema));
    console.log("Form data received:", form.data);
    if (!form.valid) {
      console.log("Form validation failed:", form.errors);
      return fail(400, { form });
    }
    try {
      const USER = await db.query.user.findFirst({
        where: eq(user.id, event.locals.user.id),
      });
      console.log("User found:", USER);
      if (!USER) {
        return fail(404, { message: "User not found" });
      }
      const newProject = await db.transaction(async (tx) => {
        const [createdProject] = await tx
          .insert(project)
          .values({
            userId: USER.id,
            name: form.data.name,
            handle: generateHandle(form.data.name),
            fromAddress: form.data.fromAddress,
            toAddress: form.data.toAddress,
            status: "draft",
          })
          .returning();

        // Process rooms if they exist
        if (form.data.rooms?.length) {
          await Promise.all(
            form.data.rooms.map((roomData) =>
              tx.insert(room).values({
                projectId: createdProject.id,
                name: roomData.name,
                handle: generateHandle(roomData.name),
                colorCode: roomData.colorCode,
              }),
            ),
          );
        }

        return createdProject;
      });

      throw redirect(303, "/dashboard");
    } catch (error) {
      if (error as Redirect) {
        throw error; // Re-throw redirect
      }
      console.error("Project Creation error:", error);
      return fail(500, {
        form,
        error: "An error occurred during project creation",
      });
    }
  },
} satisfies Actions;
