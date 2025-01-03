import { sql } from "drizzle-orm";
import { box, qrCode, item } from "../db/schema";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export async function fixBoxStates(
  db: NodePgDatabase<typeof import("../db/schema")>,
) {
  try {
    // Use raw SQL for the initial query to avoid any ORM translation issues
    const result = await db.execute(sql`
      SELECT b.*, r.id as room_id,
             (SELECT json_agg(i.*) FROM "item" i WHERE i.box_id = b.id) as items
      FROM "box" b
      LEFT JOIN "room" r ON r.id = b.room_id
      WHERE EXISTS (
        SELECT 1 FROM "item" i
        WHERE i.box_id = b.id
      ) AND NOT EXISTS (
        SELECT 1 FROM "qr_code" q
        WHERE q.box_id = b.id
        AND q.is_assigned = true
      )
    `);

    const inconsistentBoxes = result.rows;
    console.log(
      `Found ${inconsistentBoxes.length} boxes with items but no assigned QR codes`,
    );

    // Process each box
    await db.transaction(async (tx) => {
      for (const boxData of inconsistentBoxes) {
        console.log(`Processing box ${boxData.id}`);

        // Check for existing QR code by both URL and box_id
        const qrResult = await tx.execute(
          sql`SELECT * FROM "qr_code"
              WHERE url = ${"/box/" + boxData.id}
                 OR box_id = ${boxData.id}`,
        );
        const existingQr = qrResult.rows[0];

        if (existingQr) {
          console.log(`Updating existing QR code for box ${boxData.id}`);
          await tx.execute(sql`
            UPDATE "qr_code"
            SET box_id = ${boxData.id},
                is_assigned = true
            WHERE id = ${existingQr.id}
          `);
        } else {
          console.log(`Creating new QR code for box ${boxData.id}`);
          if (!boxData.room_id) {
            console.error(`Box ${boxData.id} has no room_id`);
            continue;
          }

          // Double check there's no existing QR code for this box
          const doubleCheck = await tx.execute(
            sql`SELECT id FROM "qr_code" WHERE box_id = ${boxData.id}`,
          );

          if (doubleCheck.rows.length === 0) {
            await tx.execute(sql`
              INSERT INTO "qr_code" (
                id, room_id, url, box_id, is_assigned, is_pre_generated
              ) VALUES (
                ${crypto.randomUUID()},
                ${boxData.room_id},
                ${"/box/" + boxData.id},
                ${boxData.id},
                true,
                false
              )
            `);
          } else {
            console.log(
              `Found existing QR code on double-check for box ${boxData.id}`,
            );
            // Update the existing QR code instead
            await tx.execute(sql`
              UPDATE "qr_code"
              SET is_assigned = true
              WHERE box_id = ${boxData.id}
            `);
          }
        }
      }
    });

    return {
      success: true,
      fixedBoxes: inconsistentBoxes.length,
      details: inconsistentBoxes.map((b) => ({
        boxId: b.id,
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
