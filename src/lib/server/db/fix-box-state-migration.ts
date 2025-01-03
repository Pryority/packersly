import { sql } from "drizzle-orm";
import { box, qrCode, item } from "../db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export async function fixBoxStates(
  db: NodePgDatabase<typeof import("../db/schema")>,
) {
  try {
    // Find boxes with items but no assigned QR codes
    const inconsistentBoxes = await db.query.box.findMany({
      where: sql`EXISTS (
        SELECT 1 FROM ${item}
        WHERE ${item.boxId} = ${box.id}
      ) AND NOT EXISTS (
        SELECT 1 FROM ${qrCode}
        WHERE ${qrCode.boxId} = ${box.id}
        AND ${qrCode.isAssigned} = true
      )`,
      with: {
        items: true,
        room: true,
      },
    });

    console.log(
      `Found ${inconsistentBoxes.length} boxes with items but no assigned QR codes`,
    );

    // Process each box
    await db.transaction(async (tx) => {
      for (const boxData of inconsistentBoxes) {
        console.log(`Processing box ${boxData.id}`);

        // Check for existing QR code
        const existingQr = await tx.query.qrCode.findFirst({
          where: sql`${qrCode.url} = ${"/box/" + boxData.id}`,
        });

        if (existingQr) {
          console.log(`Updating existing QR code for box ${boxData.id}`);
          await tx
            .update(qrCode)
            .set({
              boxId: boxData.id,
              isAssigned: true,
            })
            .where(sql`${qrCode.id} = ${existingQr.id}`);
        } else {
          console.log(`Creating new QR code for box ${boxData.id}`);

          if (!boxData.roomId) {
            console.error(`Box ${boxData.id} has no room_id`);
            continue;
          }

          await tx.insert(qrCode).values({
            id: crypto.randomUUID(),
            roomId: boxData.roomId,
            url: `/box/${boxData.id}`,
            boxId: boxData.id,
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

export async function addConsistencyConstraints(
  db: NodePgDatabase<typeof import("../db/schema")>,
) {
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION check_box_assignment()
    RETURNS TRIGGER AS $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM "item"
        WHERE "box_id" = NEW.id
      ) AND NOT EXISTS (
        SELECT 1 FROM "qr_code"
        WHERE "box_id" = NEW.id
        AND "is_assigned" = true
      ) THEN
        RAISE EXCEPTION 'Box must have an assigned QR code if it contains items';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS ensure_box_consistency ON "box";
    CREATE TRIGGER ensure_box_consistency
    AFTER INSERT OR UPDATE ON "box"
    FOR EACH ROW
    EXECUTE FUNCTION check_box_assignment();
  `);
}
