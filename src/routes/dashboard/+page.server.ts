// src/routes/dashboard/+page.server.ts
import { error, fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import db from "@db";
import { project, user, room } from "@db/schema";
import { eq } from "drizzle-orm";
import { projectSchema, type ProjectSchema } from "@server/zod";
import { z } from "zod";

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    throw redirect(302, "/login");
  }

  const projects = await db
    .select()
    .from(project)
    .where(eq(project.userId, locals.user.id));

  // Initial form data
  const form = {
    name: "Test Name",
    fromAddress: "Test From",
    toAddress: "Test To",
    rooms: [{ name: "Test Room", colorCode: "#000000" }],
  };

  console.log("Server Load Data:", { user: locals.user, projects, form });

  return {
    user: locals.user,
    form,
    projects,
    showCreateProject: url.searchParams.has("new"),
  };
};

export const actions = {
  "create-project": async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, "Unauthorized");
    }
    const formData = await request.formData();
    const data = JSON.parse(formData.get("formData") as string);

    try {
      const validatedData = projectSchema.parse(data);
      const userId = await db
        .select()
        .from(user)
        .where(eq(user.username, locals.user.username))
        .limit(1)
        .then((res) => res[0].id);

      const newProject = await db.transaction(async (tx) => {
        const [createdProject] = await tx
          .insert(project)
          .values({
            userId,
            name: validatedData.name,
            fromAddress: validatedData.fromAddress,
            toAddress: validatedData.toAddress,
            status: "draft",
          })
          .returning();

        await Promise.all(
          validatedData.rooms.map((roomData) =>
            tx.insert(room).values({
              projectId: createdProject.id,
              name: roomData.name,
              colorCode: roomData.colorCode,
            }),
          ),
        );
        return createdProject.id;
      });

      return { success: true };
    } catch (err) {
      if (err instanceof z.ZodError) {
        return fail(400, {
          errors: err.errors,
          data,
        });
      }
      throw error(500, "Internal server error");
    }
  },
} satisfies Actions;
