import db from "@db";
import type { LayoutServerLoad } from "./$types";
import { user } from "@db/schema";
import { eq } from "drizzle-orm";

export async function load({ locals }: { locals: any }) {
  const USER = await db
    .select() // Perform a SELECT query
    .from(user) // 'user' table reference
    .where(eq(user.username, locals.user.username)) // The condition
    .limit(1)
    .then((res) => res[0]);

  console.log(USER);
  return {
    user: USER,
  };
}
