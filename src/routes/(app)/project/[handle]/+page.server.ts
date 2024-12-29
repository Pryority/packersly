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
import { project, room, user } from "@db/schema";
import { and, eq, like } from "drizzle-orm";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { projectSchema, roomSchema } from "@routes/settings/zod";
import { generateHandle } from "@utils";

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		throw redirect(302, "/login");
	}

	const projectWithRooms = await db.query.project.findFirst({
		where: and(
			eq(project.handle, params.handle),
			eq(project.userId, locals.user.id),
		),
		columns: {
			id: true,
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
					.select({ handle: project.handle })
					.from(project)
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
	"update-project": async (event) => {
		if (!event.locals.user) {
			throw error(401, "Unauthorized");
		}

		const form = await superValidate(event.request, zod(projectSchema));
		const urlPathname = event.url.pathname;
		const pathSegments = urlPathname.split("/");
		const projectHandle = pathSegments[2];

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const USER = await db.query.user.findFirst({
				where: eq(user.id, event.locals.user.id),
			});

			if (!USER) {
				return fail(404, { message: "User not found" });
			}

			// Verify project ownership and get project data
			const existingProject = await db.query.project.findFirst({
				where: and(
					eq(project.handle, projectHandle),
					eq(project.userId, USER.id),
				),
			});

			if (!existingProject) {
				return fail(404, { message: "Project not found or unauthorized" });
			}

			await db.transaction(async (tx) => {
				// Update project details
				await tx
					.update(project)
					.set({
						name: form.data.name,
						handle: generateHandle(form.data.name),
						fromAddress: form.data.fromAddress,
						toAddress: form.data.toAddress,
					})
					.where(eq(project.handle, projectHandle));

				// Delete existing rooms using project.id, not handle
				await tx.delete(room).where(eq(room.projectId, existingProject.id));

				// Insert updated rooms using project.id
				if (form.data.rooms?.length) {
					await Promise.all(
						form.data.rooms.map((roomData) =>
							tx.insert(room).values({
								id: crypto.randomUUID(), // Add unique ID for new rooms
								projectId: existingProject.id, // Use the project's ID
								name: roomData.name,
								handle: generateHandle(roomData.name),
								colorCode: roomData.colorCode,
							}),
						),
					);
				}
			});

			// Redirect to the new project handle path
			throw redirect(303, `/project/${generateHandle(form.data.name)}`);
		} catch (error) {
			if (error as Redirect) {
				throw error;
			}
			console.error("Project Update error:", error);
			return fail(500, {
				form,
				error: "An error occurred while updating the project",
			});
		}
	},
} satisfies Actions;
