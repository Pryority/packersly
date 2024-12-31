import { pgTable, text, uuid, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import room from "./room";
import item, { type Item } from "./item";
import qrCode, { type QrCode } from "./qrCode";

const box = pgTable("box", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id").references(() => room.id, { onDelete: "cascade" }),
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
  qrCode: one(qrCode, {
    fields: [box.id],
    references: [qrCode.boxId],
  }),
}));

export type Box = typeof box.$inferSelect & { items: Item[]; qrCode: QrCode };
export default box;
