import db from "@db";
import { item } from "@db/schema";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { validate as validateUUID } from "uuid";

// /api/box/[id]/items/check/+server.ts
export const GET: RequestHandler = async ({ params, url }) => {
  const boxId = params.id;
  if (!validateUUID(boxId)) {
    throw error(400, "Invalid box ID format");
  }
  const name = url.searchParams.get("name");
  if (!name) {
    throw error(400, "Name parameter is required");
  }

  const existingItem = await db.query.item.findFirst({
    where: and(eq(item.name, name), eq(item.boxId, boxId as string)),
  });
  return json(!!existingItem);
};
