import { sql } from "drizzle-orm";
import { box, qrCode, item } from "@db/schema";
import db from "@db";

// Migration to fix inconsistent box states
export async function fixBoxStates() {
  try {
    // Find all boxes that have items but are marked as unassigned
    const inconsistentBoxes = await db.query.box.findMany({
      where: sql`${box.id} IN (
        SELECT DISTINCT ${item.boxId}
        FROM ${item}
        WHERE ${item.boxId} NOT IN (
          SELECT ${qrCode.boxId}
          FROM ${qrCode}
          WHERE ${qrCode.isAssigned} = true
        )
      )`,
      with: {
        items: true,
      },
    });

    // Process each inconsistent box
    await db.transaction(async (tx) => {
      for (const box of inconsistentBoxes) {
        // Create a new QR code for this box if none exists
        const existingQr = await tx.query.qrCode.findFirst({
          where: sql`${qrCode.url} LIKE ${"%/box/" + box.id + "%"}`,
        });

        if (existingQr) {
          // Update existing QR code
          await tx
            .update(qrCode)
            .set({
              boxId: box.id,
              isAssigned: true,
            })
            .where(sql`${qrCode.id} = ${existingQr.id}`);
        } else {
          // Create new QR code
          // Ensure box has a roomId before creating QR code
          if (!box.roomId) {
            throw new Error(`Box ${box.id} has no roomId`);
          }

          await tx.insert(qrCode).values({
            roomId: box.roomId,
            url: `/box/${box.id}`,
            id: crypto.randomUUID(),
            boxId: box.id,
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
export async function addConsistencyConstraints() {
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION check_box_assignment()
    RETURNS TRIGGER AS $$
    BEGIN
      -- If there are items, ensure there's an assigned QR code
      IF EXISTS (
        SELECT 1 FROM ${item} WHERE boxId = NEW.id
      ) AND NOT EXISTS (
        SELECT 1 FROM ${qrCode}
        WHERE boxId = NEW.id AND isAssigned = true
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
