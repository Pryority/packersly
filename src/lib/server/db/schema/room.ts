import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import project from "./project";
import box from "./box";

const room = pgTable(
  "room",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id),
    name: text("name").notNull(),
    handle: text("handle").notNull(),
    colorCode: text("color_code").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Add raw SQL constraints for min and max length
    sql`CHECK (char_length(${table.name}) >= 3 AND char_length(${table.name}) <= 50)`,
    sql`CHECK (char_length(${table.handle}) >= 3 AND char_length(${table.handle}) <= 50)`,
    // Ensure unique handle per projectId (per user)
    sql`CONSTRAINT unique_room_handle_per_project UNIQUE (${table.projectId}, ${table.handle})`,
  ],
);

export const roomRelations = relations(room, ({ one, many }) => ({
  project: one(project, {
    fields: [room.projectId],
    references: [project.id],
  }),
  boxes: many(box),
}));

export type Room = typeof room.$inferSelect;
export default room;
