// src/routes/dashboard/+page.server.ts
import { error, fail, redirect } from "@sveltejs/kit";
import db from "@db";
import { project, user, room } from "@db/schema";
import type { Actions, PageServerLoad } from "./$types";
import { eq } from "drizzle-orm";
import { projectSchema } from "@server/zod";

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(302, "/login");
	}

	// Get the dialog state from URL
	const showCreateProject = url.searchParams.has("new");

	// const USER = await db
	//   .select() // Perform a SELECT query
	//   .from(user) // 'user' table reference
	//   .where(eq(user.username, locals.user.username)) // The condition
	//   .limit(1)
	//   .then((res) => res[0]);

	// console.log(USER);
	return {
		showCreateProject,
	};
};

export const actions: Actions = {
	"create-project": async ({ request, locals }) => {
		if (!locals.user) {
			throw error(401, "Unauthorized");
		}
		const formData = await request.formData();

		// Get all entries and group them
		const entries = Array.from(formData.entries());

		const roomNames = entries
			.filter(([key]) => key === "rooms[]")
			.map(([_, value]) => value as string);

		const roomColors = entries
			.filter(([key]) => key === "roomColors[]")
			.map(([_, value]) => value as string);

		const data = {
			name: formData.get("name") as string,
			fromAddress: formData.get("fromAddress") as string,
			toAddress: formData.get("toAddress") as string,
			rooms: roomNames.map((name, i) => ({
				name,
				colorCode: roomColors[i],
			})),
		};

		const result = projectSchema.safeParse(data);
		if (!result.success) {
			return fail(400, {
				data: {
					name: data.name,
					fromAddress: data.fromAddress,
					toAddress: data.toAddress,
					rooms: data.rooms,
				},
				errors: result.error.flatten(),
			});
		}

		const userId = await db
			.select()
			.from(user)
			.where(eq(user.username, locals.user.username))
			.limit(1)
			.then((res) => res[0].id);

		try {
			const newProject = await db.transaction(async (tx) => {
				const [createdProject] = await tx
					.insert(project)
					.values({
						userId,
						name: result.data.name,
						fromAddress: result.data.fromAddress,
						toAddress: result.data.toAddress,
						status: "draft",
					})
					.returning();

				// Insert all rooms but don't return them
				await Promise.all(
					result.data.rooms.map((roomData) =>
						tx.insert(room).values({
							projectId: createdProject.id,
							name: roomData.name,
							colorCode: roomData.colorCode,
						}),
					),
				);

				return createdProject.id;
			});

			return redirect(302, `/project/${newProject}`);
		} catch (e) {
			console.error(e);
			return fail(500, {
				data: {
					name: data.name,
					fromAddress: data.fromAddress,
					toAddress: data.toAddress,
					rooms: data.rooms,
				},
				errors: { form: ["Could not create project"] },
			});
		}
	},
};
