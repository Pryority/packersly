import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import user from "./user";
import room from "./room";

const project = pgTable(
  "project",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    name: text("name").notNull(),
    handle: text("handle").notNull(),
    fromAddress: text("from_address").notNull(),
    toAddress: text("to_address").notNull(),
    status: text("status", { enum: ["draft", "active", "completed"] })
      .notNull()
      .default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    sql`CHECK (char_length(${table.name}) >= 3 AND char_length(${table.name}) <= 50)`,
    sql`CHECK (char_length(${table.handle}) >= 3 AND char_length(${table.handle}) <= 50)`,
    uniqueIndex("unique_project_handle_per_user").on(
      table.userId,
      table.handle,
    ),
  ],
);

export const projectRelations = relations(project, ({ one, many }) => ({
  user: one(user, {
    fields: [project.userId],
    references: [user.id],
  }),
  rooms: many(room),
}));

export type Project = typeof project.$inferSelect;
export default project;
