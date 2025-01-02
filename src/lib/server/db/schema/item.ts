import { pgTable, text, uuid, timestamp, integer } from "drizzle-orm/pg-core";
import box from "./box";
import { relations } from "drizzle-orm";

const item = pgTable("item", {
  id: uuid("id").defaultRandom().primaryKey(),
  boxId: uuid("box_id")
    .notNull()
    .references(() => box.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  quantity: integer("quantity").default(1),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const itemRelations = relations(item, ({ one }) => ({
  box: one(box, {
    fields: [item.boxId],
    references: [box.id],
  }),
}));

export type Item = typeof item.$inferSelect;
export default item;
