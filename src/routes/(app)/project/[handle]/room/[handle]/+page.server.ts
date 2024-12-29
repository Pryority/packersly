// src/routes/project/[handle]/room/[handle]/+page.server.ts
import {
	error,
	fail,
	redirect,
	type Actions,
	type Redirect,
} from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { box, item, project, room, qrCode } from "@db/schema";
import { and, count, eq } from "drizzle-orm";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import boxSchema from "@routes/settings/zod/boxSchema";
import db from "@db";

export const load: PageServerLoad = async ({ locals, url, params }) => {
	if (!locals.user) {
		throw redirect(302, "/login");
	}

	const urlPathname = url.pathname; // "/project/the-big-move"
	const pathSegments = urlPathname.split("/");
	const projectHandle = pathSegments[2]; // "the-big-move"

	// Get just the room we need with its boxes
	const ROOM = await db.query.room.findFirst({
		where: and(
			eq(room.handle, params.handle),
			eq(
				room.projectId,
				db
					.select({ id: project.id })
					.from(project)
					.where(
						and(
							eq(project.handle, projectHandle),
							eq(project.userId, locals.user.id),
						),
					)
					.limit(1),
			),
		),
		with: {
			boxes: {
				with: {
					qrCode: true,
					items: true,
				},
			},
		},
	});

	if (!ROOM) {
		throw redirect(302, "/dashboard");
	}

	// Get count of available QR codes for room
	const availableQrCodes = await db
		.select({ count: count() })
		.from(qrCode)
		.where(
			and(
				eq(qrCode.roomId, ROOM.id),
				eq(qrCode.isAssigned, false),
				eq(qrCode.isPreGenerated, true),
			),
		)
		.limit(1)
		.then((res) => res[0].count);

	console.log(`Available QR Codes: ${availableQrCodes}`);

	return {
		room: ROOM,
		availableQrCodes,
		form: await superValidate(zod(boxSchema)),
	};
};

export const actions = {
	"create-box": async ({ locals, request, params, url }) => {
		if (!locals.user) throw error(401, "Unauthorized");

		const form = await superValidate(request, zod(boxSchema));
		if (!form.valid) return fail(400, { form });

		const pathParts = url.pathname.split("/");
		const projectHandle = pathParts[2];
		const roomHandle = params.handle;

		if (!roomHandle || !projectHandle) {
			return fail(400, {
				form,
				message: "Both project and room handles are required",
			});
		}

		try {
			// Combine project and room lookup into a single query
			const [result] = await db
				.select({
					project: { id: project.id },
					room: { id: room.id, handle: room.handle },
				})
				.from(project)
				.innerJoin(
					room,
					and(eq(room.projectId, project.id), eq(room.handle, roomHandle)),
				)
				.where(
					and(
						eq(project.handle, projectHandle),
						eq(project.userId, locals.user.id),
					),
				)
				.limit(1);

			if (!result) {
				return fail(404, { form, message: "Project or room not found" });
			}

			// First, find an available pre-generated QR code for room
			const [availableQrCode] = await db
				.select()
				.from(qrCode)
				.where(
					and(
						eq(qrCode.roomId, result.room.id),
						eq(qrCode.isPreGenerated, true),
						eq(qrCode.isAssigned, false),
					),
				)
				.limit(1);

			if (!availableQrCode) {
				return fail(400, {
					form,
					message:
						"No QR codes available. Please generate more QR codes first.",
				});
			}

			const boxId = crypto.randomUUID();
			const accessToken = crypto.randomUUID();

			// Pre-generate QR code URL
			//const boxUrl = new URL(
			//	`/project/${projectHandle}/room/${result.room.handle}/box/${boxId}`,
			//	`https://${url.host}`,
			//);
			//boxUrl.searchParams.set("token", accessToken);

			// Prepare all insert values outside the transaction
			const boxValues = {
				id: boxId,
				roomId: result.room.id,
				accessToken,
				isPublic: false,
			};

			// const qrValues = {
			// 	boxId,
			// 	url: boxUrl.toString(),
			// };

			const itemValues =
				form.data.items?.map((itemData) => ({
					id: crypto.randomUUID(),
					boxId,
					name: itemData.name,
					quantity: itemData.quantity,
				})) ?? [];

			// Single transaction with all inserts
			await db.transaction(async (tx) => {
				await Promise.all([
					tx.insert(box).values(boxValues),
					tx
						.update(qrCode)
						.set({ boxId, isAssigned: true })
						.where(eq(qrCode.id, availableQrCode.id)),
					itemValues.length > 0
						? tx.insert(item).values(itemValues)
						: Promise.resolve(),
				]);
			});

			throw redirect(303, `${url.pathname}/box/${boxId}`);
		} catch (error) {
			if (error as Redirect) throw error;

			console.error("Box Creation error:", {
				error,
				message: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			});

			if (
				error instanceof Error &&
				error.message.toLowerCase().includes("duplicate key")
			) {
				return fail(409, {
					form,
					message: "A box with this access token already exists",
				});
			}

			return fail(500, {
				form,
				message: "An error occurred during box creation",
			});
		}
	},
} satisfies Actions;
