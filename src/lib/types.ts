import type { Item } from "@db/schema";
import type { Box } from "@db/schema/box";
import type { Project } from "@db/schema/project";
import type { Room } from "@db/schema/room";

export type ProjectData = Project & {
  rooms: (Room & {
    boxes: BoxWithOptionalItems[];
  })[];
};

export type BoxWithOptionalItems = Box & {
  items?: Item[];
};
