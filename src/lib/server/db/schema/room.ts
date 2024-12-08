const room = pgTable("room", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => project.id),
  name: text("name").notNull(),
  colorCode: text("color_code").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const roomRelations = relations(room, ({ one, many }) => ({
  project: one(project, {
    fields: [room.projectId],
    references: [project.id],
  }),
  boxes: many(box),
}));

export type Room = typeof room.$inferSelect;
export default room;
