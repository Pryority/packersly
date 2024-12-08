import { desc, eq } from "drizzle-orm";
import db from "..";
import type { Project } from "../schema/project";
import project from "../schema/project";

async function loadUserProjects(userId: string): Promise<Project[]> {
  return await db.query.project.findMany({
    where: eq(project.userId, userId),
    with: {
      rooms: true,
    },
    orderBy: [desc(project.createdAt)],
  });
}

export default loadUserProjects;
