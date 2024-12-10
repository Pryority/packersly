import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
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
    boxCount: integer("box_count").default(0),
    itemCount: integer("item_count").default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      // Add raw SQL constraints for min and max length
      nameLengthConstraint: sql`CHECK (char_length(${table.name}) >= 3 AND char_length(${table.name}) <= 50)`,
      handleLengthConstraint: sql`CHECK (char_length(${table.handle}) >= 3 AND char_length(${table.handle}) <= 50)`,
    };
  },
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
