import type { Project } from "@db/schema/project";
import type { Room } from "@db/schema/room";

export type ProjectWithRooms = Project & { rooms: Room[] };
