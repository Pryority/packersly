// src/routes/project/[handle]/room/[handle]/+page.server.ts
import {
  error,
  fail,
  redirect,
  type Actions,
  type Redirect,
} from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import db from "@db";
import { box, item, project, room, qrCode } from "@db/schema";
import { and, eq } from "drizzle-orm";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import boxSchema from "@routes/settings/zod/boxSchema";
import QRCode from "qrcode";

export const load: PageServerLoad = async ({ locals, url, params }) => {
  if (!locals.user) {
    throw redirect(302, "/login");
  }
  console.log("LOADING ROOM DATA");

  // console.log(url);

  const urlPathname = url.pathname; // "/project/the-big-move"
  const pathSegments = urlPathname.split("/");
  const projectHandle = pathSegments[2]; // "the-big-move"
  // console.log("urlPathname", urlPathname);
  // console.log("pathSegments", pathSegments);
  // console.log("projectHandle", projectHandle);

  const PROJECT = await db.query.project.findFirst({
    where: and(
      eq(project.handle, projectHandle),
      eq(project.userId, locals.user.id),
    ),
    with: {
      rooms: {
        with: {
          boxes: {
            with: {
              qrCode: true,
              items: true,
            },
          },
        },
      },
    },
  });

  // console.log("Raw PROJECT query result:", PROJECT);
  // // console.log("ROOM boxes length:", ROOM?.boxes?.length);
  // // console.log("First box details:", ROOM?.boxes?.[0]);

  if (!PROJECT) {
    throw redirect(302, "/dashboard"); // or handle the "room not found" case
  }

  return {
    // room: ROOM,
    room: PROJECT.rooms.find((r) => r.handle === params.handle),
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
      const PROJECT = await db.query.project.findFirst({
        where: eq(project.handle, projectHandle),
        columns: { id: true, userId: true },
      });

      if (!PROJECT || PROJECT.userId !== locals.user.id) {
        return fail(403, { form, message: "Project access denied" });
      }

      const ROOM = await db.query.room.findFirst({
        where: and(eq(room.handle, roomHandle), eq(room.projectId, PROJECT.id)),
      });

      if (!ROOM) {
        return fail(404, { form, message: "Room not found" });
      }

      const boxId = crypto.randomUUID();
      const accessToken = crypto.randomUUID();

      // Generate QR code first
      const boxUrl = new URL(
        `/project/${projectHandle}/room/${ROOM.handle}/box/${boxId}`,
        `https://${url.host}`,
      );
      boxUrl.searchParams.set("token", accessToken);

      const newBox = await db.transaction(async (tx) => {
        const [boxResult] = await tx
          .insert(box)
          .values({
            id: boxId,
            roomId: ROOM.id,
            accessToken,
            isPublic: false,
          })
          .returning();

        if (!boxResult) throw new Error("Failed to create box");

        const [qrResult] = await tx
          .insert(qrCode)
          .values({
            boxId,
            url: boxUrl.toString(), // Store the URL string
          })
          .returning();

        if (!qrResult) throw new Error("Failed to store QR code URL");

        // Create items if they exist
        if (form.data.items?.length) {
          await tx.insert(item).values(
            form.data.items.map((itemData) => ({
              id: crypto.randomUUID(),
              boxId,
              name: itemData.name,
              quantity: itemData.quantity,
            })),
          );
        }

        return boxResult;
      });

      throw redirect(303, `${url.pathname}/box/${boxId}`);
    } catch (error) {
      if (error as Redirect) throw error;

      console.error("Box Creation error:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.toLowerCase().includes("duplicate key")) {
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
