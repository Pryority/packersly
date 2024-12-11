import type { Project } from "@db/schema/project";
import type { Room } from "@db/schema/room";

export interface ProjectWithRooms extends Project {
  rooms: Room[];
}
