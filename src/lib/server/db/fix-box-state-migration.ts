import { sql } from "drizzle-orm";
import { box, qrCode, item } from "../db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

// Migration to fix inconsistent box states
export async function fixBoxStates(
  db: NodePgDatabase<typeof import("../db/schema")>,
) {
  try {
    // Find all boxes that have items but are marked as unassigned
    const inconsistentBoxes = await db.query.box.findMany({
      where: sql`EXISTS (
        SELECT 1 FROM ${item}
        WHERE ${item.boxId} = ${box.id}
        AND NOT EXISTS (
          SELECT 1 FROM ${qrCode}
          WHERE ${qrCode.boxId} = ${box.id}
          AND ${qrCode.isAssigned} = true
        )
      )`,
      with: {
        items: true,
        room: true,
      },
    });

    console.log(`Found ${inconsistentBoxes.length} inconsistent boxes`);

    // Process each inconsistent box
    await db.transaction(async (tx) => {
      for (const boxItem of inconsistentBoxes) {
        console.log(`Processing box ${boxItem.id}`);

        // Create a new QR code for this box if none exists
        const existingQr = await tx.query.qrCode.findFirst({
          where: sql`${qrCode.url} LIKE ${"%/box/" + boxItem.id + "%"}`,
        });

        if (existingQr) {
          console.log(`Updating existing QR code for box ${boxItem.id}`);
          // Update existing QR code
          await tx
            .update(qrCode)
            .set({
              boxId: boxItem.id,
              isAssigned: true,
            })
            .where(sql`${qrCode.id} = ${existingQr.id}`);
        } else {
          console.log(`Creating new QR code for box ${boxItem.id}`);
          // Ensure box has a roomId before creating QR code
          if (!boxItem.room?.id) {
            console.error(`Box ${boxItem.id} has no roomId`);
            continue;
          }

          await tx.insert(qrCode).values({
            roomId: boxItem.room.id,
            url: `/box/${boxItem.id}`,
            id: crypto.randomUUID(),
            boxId: boxItem.id,
            isAssigned: true,
            isPreGenerated: false,
          });
        }
      }
    });

    return {
      success: true,
      fixedBoxes: inconsistentBoxes.length,
      details: inconsistentBoxes.map((b) => ({
        boxId: b.id,
        itemCount: b.items.length,
      })),
    };
  } catch (error) {
    console.error("Error fixing box states:", error);
    throw error;
  }
}

// Prevention: Add a trigger or constraint to prevent future inconsistencies
export async function addConsistencyConstraints(
  db: NodePgDatabase<typeof import("../db/schema")>,
) {
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION check_box_assignment()
    RETURNS TRIGGER AS $$
    BEGIN
      -- If there are items, ensure there's an assigned QR code
      IF EXISTS (
        SELECT 1 FROM ${item} WHERE ${item.boxId} = NEW.id
      ) AND NOT EXISTS (
        SELECT 1 FROM ${qrCode}
        WHERE ${qrCode.boxId} = NEW.id AND ${qrCode.isAssigned} = true
      ) THEN
        RAISE EXCEPTION 'Box must have an assigned QR code if it contains items';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS ensure_box_consistency ON ${box};
    CREATE TRIGGER ensure_box_consistency
    AFTER INSERT OR UPDATE ON ${box}
    FOR EACH ROW
    EXECUTE FUNCTION check_box_assignment();
  `);
}
