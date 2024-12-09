import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import project from "./project";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  userType: text("user_type", { enum: ["agent", "client"] })
    .notNull()
    .default("client"),
});

export const userRelations = relations(user, ({ many }) => ({
  projects: many(project),
}));

export type User = typeof user.$inferSelect;
export default user;
