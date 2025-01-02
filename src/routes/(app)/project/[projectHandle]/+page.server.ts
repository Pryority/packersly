// src/routes/project/[projectHandle]/+page.server.ts
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
import * as schema from "@db/schema";
import {
  and,
  eq,
  like,
  ne,
  type ExtractTablesWithRelations,
} from "drizzle-orm";
import { message, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { projectSchema, roomSchema } from "@routes/settings/zod";
import { generateHandle } from "@utils";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.user) {
    throw redirect(302, "/login");
  }

  const projectWithRooms = await db.query.project.findFirst({
    where: and(
      eq(project.handle, params.projectHandle),
      eq(project.userId, locals.user.id),
    ),
    columns: {
      id: true,
      handle: true,
      name: true,
      fromAddress: true,
      toAddress: true,
    },
    with: {
      rooms: {
        columns: {
          id: true,
          name: true,
          handle: true,
          colorCode: true,
        },
        with: {
          boxes: {
            with: {
              items: true,
              qrCode: true,
            },
          },
        },
      },
    },
  });

  if (!projectWithRooms) {
    throw redirect(302, "/dashboard");
  }

  const [projectUpdateForm, createRoomForm] = await Promise.all([
    superValidate(
      {
        name: projectWithRooms.name,
        fromAddress: projectWithRooms.fromAddress,
        toAddress: projectWithRooms.toAddress,
        rooms: projectWithRooms.rooms,
      },
      zod(projectSchema),
    ),
    superValidate(zod(roomSchema)),
  ]);

  return {
    project: {
      id: projectWithRooms.id,
      handle: projectWithRooms.handle,
      name: projectWithRooms.name,
      fromAddress: projectWithRooms.fromAddress,
      toAddress: projectWithRooms.toAddress,
    },
    form: createRoomForm,
    projectUpdateForm,
    rooms: projectWithRooms.rooms,
  };
};

export const actions = {
  "create-room": async ({ locals, request, params }) => {
    if (!locals.user) {
      throw error(401, "Unauthorized");
    }

    const form = await superValidate(request, zod(roomSchema));
    // console.log("Form data received:", form.data);
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
        const baseRoomHandle = generateHandle(form.data.name);
        const roomId = crypto.randomUUID();

        const existingRooms = await tx
          .select({ handle: room.handle })
          .from(room)
          .where(
            and(
              eq(room.projectId, PROJECT.id),
              like(room.handle, `${baseRoomHandle}%`),
            ),
          );

        let uniqueRoomHandle = baseRoomHandle;
        if (existingRooms.length > 0) {
          uniqueRoomHandle = `${baseRoomHandle}-${existingRooms.length + 1}`;
        }

        // Create the room
        const [createdRoom] = await tx
          .insert(room)
          .values({
            id: roomId,
            projectId: PROJECT.id,
            name: form.data.name,
            handle: uniqueRoomHandle,
            colorCode: form.data.colorCode,
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
  "update-project": async ({ request, locals, params }) => {
    if (!locals.user) throw error(401, "Unauthorized");
    const userId = locals.user.id;

    // Validate the form
    const form = await superValidate(request, zod(projectSchema));
    if (!form.valid) {
      console.error("Validation failed:", form.errors);
      return fail(400, { form });
    }

    // console.log("Form data:", form.data);

    const { projectHandle } = params;
    if (!projectHandle) {
      return fail(400, { form, message: "Project handle required" });
    }

    try {
      const updatedProjectHandle = await db.transaction(async (tx) => {
        // Check if project exists and belongs to user
        const existingProject = await tx.query.project.findFirst({
          where: and(
            eq(project.handle, projectHandle),
            eq(project.userId, userId),
          ),
          with: { rooms: true },
        });

        // console.log("Existing project:", existingProject);

        if (!existingProject) {
          return fail(404, { form, message: "Project not found" });
        }

        // Generate new handle if name changed
        let uniqueHandle = projectHandle;
        if (form.data.name !== existingProject.name) {
          uniqueHandle = await generateUniqueHandle(
            tx,
            form.data.name,
            userId,
            existingProject.id,
          );
        }

        // console.log("New handle:", uniqueHandle);

        // Update project
        const updateResult = await tx
          .update(project)
          .set({
            name: form.data.name,
            handle: uniqueHandle,
            fromAddress: form.data.fromAddress,
            toAddress: form.data.toAddress,
          })
          .where(eq(project.id, existingProject.id))
          .returning(); // Add this to see what was updated

        // console.log("Update result:", updateResult);

        // Handle rooms update
        if (form.data.rooms && form.data.rooms.length > 0) {
          // Delete existing rooms
          const deleteResult = await tx
            .delete(room)
            .where(eq(room.projectId, existingProject.id))
            .returning();

          console.log("Delete rooms result:", deleteResult);

          // Insert new rooms
          const insertResult = await tx
            .insert(room)
            .values(
              form.data.rooms.map((roomData) => ({
                id: crypto.randomUUID(),
                projectId: existingProject.id,
                name: roomData.name,
                handle: generateHandle(roomData.name),
                colorCode: roomData.colorCode,
              })),
            )
            .returning();

          console.log("Insert rooms result:", insertResult);
        }

        return uniqueHandle;
      });

      return message(form, {
        text: "Updated Project!",
        projectHandle: updatedProjectHandle,
      });
    } catch (error) {
      console.error("Project Update error:", error);
      console.error("Full error:", JSON.stringify(error, null, 2));
      return fail(500, { form, message: "Failed to update project" });
    }
  },
  "delete-project": async ({ locals, params }) => {
    if (!locals.user) throw error(401, "Unauthorized");
    const userId = locals.user.id;

    const { projectHandle } = params;
    if (!projectHandle)
      return fail(400, { message: "Project handle required" });

    // console.log(projectHandle);

    try {
      await db
        .delete(project)
        .where(
          and(eq(project.userId, userId), eq(project.handle, projectHandle)),
        );
      throw redirect(303, "/dashboard");
    } catch (error) {
      if (error as Redirect) throw error;
      console.error("Project Delete error:", error);
      return fail(500, { error: "Delete failed" });
    }
  },
} satisfies Actions;

type DbTransaction = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

type GenerateUniqueHandleParams = {
  tx: DbTransaction; // Scoped transaction for database operations
  name: string; // The project name to generate a unique handle
  userId: string; // The user's unique ID (UUID as a string)
  currentProjectId: string; // The ID of the project being updated (UUID as a string)
};

// Helper function for generating unique handles
async function generateUniqueHandle(
  tx: GenerateUniqueHandleParams["tx"],
  name: GenerateUniqueHandleParams["name"],
  userId: GenerateUniqueHandleParams["userId"],
  currentProjectId: GenerateUniqueHandleParams["currentProjectId"],
): Promise<string> {
  const baseHandle = generateHandle(name);
  const existingProjects = await tx
    .select({ handle: project.handle })
    .from(project)
    .where(
      and(
        eq(project.userId, userId),
        like(project.handle, `${baseHandle}%`),
        ne(project.id, currentProjectId),
      ),
    );

  return existingProjects.length > 0
    ? `${baseHandle}-${existingProjects.length + 1}`
    : baseHandle;
}
