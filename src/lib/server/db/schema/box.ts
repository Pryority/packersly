import { pgTable, text, uuid, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import room from "./room";
import item from "./item";

const box = pgTable("box", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => room.id),
  qrCode: text("qr_code").notNull().unique(),
  notes: text("notes"),
  accessToken: text("access_token").notNull().unique(),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const boxRelations = relations(box, ({ one, many }) => ({
  room: one(room, {
    fields: [box.roomId],
    references: [room.id],
  }),
  items: many(item),
}));

export type Box = typeof box.$inferSelect;
export default box;
