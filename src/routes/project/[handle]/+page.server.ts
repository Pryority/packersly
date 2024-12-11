// src/routes/dashboard/+page.server.ts
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import db from "@db";
import { project } from "@db/schema";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    throw redirect(302, "/login");
  }

  console.log(url);

  const urlPathname = url.pathname; // "/project/the-big-move"
  const pathSegments = urlPathname.split("/");
  const projectHandle = pathSegments[pathSegments.length - 1]; // "the-big-move"
  const PROJECT = await db.query.project.findFirst({
    where: eq(project.handle, projectHandle),
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
  };
};

// export const actions = {
//   "create-project": async ({ request, locals }) => {
//     if (!locals.user) {
//       throw error(401, "Unauthorized");
//     }
//     const formData = await request.formData();
//     const data = JSON.parse(formData.get("formData") as string);

//     try {
//       const validatedData = projectSchema.parse(data);
//       const userId = await db
//         .select()
//         .from(user)
//         .where(eq(user.username, locals.user.username))
//         .limit(1)
//         .then((res) => res[0].id);

//       const newProject = await db.transaction(async (tx) => {
//         const [createdProject] = await tx
//           .insert(project)
//           .values({
//             userId,
//             name: validatedData.name,
//             handle: generateHandle(validatedData.name),
//             fromAddress: validatedData.fromAddress,
//             toAddress: validatedData.toAddress,
//             status: "draft",
//           })
//           .returning();

//         await Promise.all(
//           validatedData.rooms.map((roomData) =>
//             tx.insert(room).values({
//               projectId: createdProject.id,
//               name: roomData.name,
//               handle: generateHandle(roomData.name),
//               colorCode: roomData.colorCode,
//             }),
//           ),
//         );
//         return createdProject.id;
//       });

//       return { success: true };
//     } catch (err) {
//       if (err instanceof z.ZodError) {
//         return fail(400, {
//           errors: err.errors,
//           data,
//         });
//       }
//       throw error(500, "Internal server error");
//     }
//   },
// } satisfies Actions;
