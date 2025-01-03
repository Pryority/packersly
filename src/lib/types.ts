import type { Box } from "@db/schema/box";
import type { Project } from "@db/schema/project";
import type { QrCode } from "@db/schema/qrCode";
import type room from "@db/schema/room";
import type { Room } from "@db/schema/room";
import type { InferSelectModel } from "drizzle-orm";

// export type ProjectData = Project & {
//   rooms: (Room & {
//     boxes: BoxWithRelations[];
//   })[];
// };

// export type BoxWithRelations = Box & {
//   qrCode?: QrCode | null;
//   items?: Array<{
//     id: string;
//     name: string;
//     quantity: number;
//   }> | null;
// };

// export type RoomWithRelations = InferSelectModel<typeof room> & {
//   boxes: BoxWithRelations[]; // An array of boxes with optional items
// };

// // Type for the basic project info that loads immediately
// export type ProjectBasic = {
//   id: string;
//   handle: string;
//   name: string;
//   fromAddress: string;
//   toAddress: string;
// };

// // Type for the streamed data
// export type StreamedData = {
//   rooms: Promise<RoomWithRelations[]>;
// };
