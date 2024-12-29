import { pgTable, text, uuid, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import box from "./box";
import room from "./room";

const qrCode = pgTable("qr_code", {
	id: uuid("id").defaultRandom().primaryKey(),
	roomId: uuid("room_id")
		.references(() => room.id, { onDelete: "cascade" })
		.notNull(),
	boxId: uuid("box_id")
		.references(() => box.id, { onDelete: "cascade" })
		.unique(), // Makes this a one-to-one relationship
	url: text("url").notNull(),
	isAssigned: boolean("is_assigned").default(false).notNull(),
	isPreGenerated: boolean("is_pre_generated").default(false).notNull(),
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
	room: one(room, {
		fields: [qrCode.roomId],
		references: [room.id],
	}),
}));

export type QrCode = typeof qrCode.$inferSelect;
export default qrCode;
