-- drizzle/0004_handle_existing_data.sql
BEGIN;

-- Temporarily disable triggers
ALTER TABLE room DISABLE TRIGGER ALL;
ALTER TABLE box DISABLE TRIGGER ALL;
ALTER TABLE qr_code DISABLE TRIGGER ALL;

-- Drop constraints
ALTER TABLE qr_code DROP CONSTRAINT IF EXISTS qr_code_box_id_box_id_fk;
ALTER TABLE box DROP CONSTRAINT IF EXISTS box_room_id_room_id_fk;
ALTER TABLE room DROP CONSTRAINT IF EXISTS room_project_id_project_id_fk;

-- Recreate constraints with cascade
ALTER TABLE room ADD CONSTRAINT room_project_id_project_id_fk
  FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE;
ALTER TABLE box ADD CONSTRAINT box_room_id_room_id_fk
  FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE CASCADE;
ALTER TABLE qr_code ADD CONSTRAINT qr_code_box_id_box_id_fk
  FOREIGN KEY (box_id) REFERENCES box(id) ON DELETE CASCADE;

-- Re-enable triggers
ALTER TABLE room ENABLE TRIGGER ALL;
ALTER TABLE box ENABLE TRIGGER ALL;
ALTER TABLE qr_code ENABLE TRIGGER ALL;

COMMIT;
