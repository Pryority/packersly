import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import box from "./box";

const qrCode = pgTable("qr_code", {
  id: uuid("id").defaultRandom().primaryKey(),
  boxId: uuid("box_id")
    .references(() => box.id, { onDelete: "cascade" })
    .unique(), // Makes this a one-to-one relationship
  url: text("url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const qrCodeRelations = relations(qrCode, ({ one }) => ({
  box: one(box, {
    fields: [qrCode.boxId],
    references: [box.id],
  }),
}));

export type QrCode = typeof qrCode.$inferSelect;
export default qrCode;
