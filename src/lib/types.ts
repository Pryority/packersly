import type { box, item, Item, room } from "@db/schema";
import type { Box } from "@db/schema/box";
import type { Project } from "@db/schema/project";
import type { QrCode } from "@db/schema/qrCode";
import type { Room } from "@db/schema/room";
import type { InferSelectModel } from "drizzle-orm";

export type ProjectData = Project & {
  rooms: (Room & {
    boxes: BoxWithRelations[];
  })[];
};

export type BoxWithRelations = Box & {
  qrCode?: QrCode | null;
  items?: Array<{
    id: string;
    name: string;
    quantity: number;
  }> | null;
};

export type RoomWithRelations = InferSelectModel<typeof room> & {
  boxes: BoxWithRelations[]; // An array of boxes with optional items
};
