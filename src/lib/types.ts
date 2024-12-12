import type { box, item, Item, room } from "@db/schema";
import type { Box } from "@db/schema/box";
import type { Project } from "@db/schema/project";
import type { Room } from "@db/schema/room";
import type { InferSelectModel } from "drizzle-orm";

export type ProjectData = Project & {
  rooms: (Room & {
    boxes: BoxWithOptionalItems[];
  })[];
};

export type BoxWithOptionalItems = InferSelectModel<typeof box> & {
  items?: InferSelectModel<typeof item>[]; // Items may be undefined or an array
};

export type RoomWithRelations = InferSelectModel<typeof room> & {
  boxes: BoxWithOptionalItems[]; // An array of boxes with optional items
};
