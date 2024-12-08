import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import room from "./room";

const box = pgTable("box", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => room.id),
  qrCode: text("qr_code").notNull().unique(),
  contents: text("contents").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const boxRelations = relations(box, ({ one }) => ({
  room: one(room, {
    fields: [box.roomId],
    references: [room.id],
  }),
}));

export type Box = typeof box.$inferSelect;
export default box;
