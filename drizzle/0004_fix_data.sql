-- Drop all related constraints first
ALTER TABLE qr_code DROP CONSTRAINT IF EXISTS qr_code_box_id_box_id_fk CASCADE;
ALTER TABLE box DROP CONSTRAINT IF EXISTS box_room_id_room_id_fk CASCADE;
ALTER TABLE room DROP CONSTRAINT IF EXISTS room_project_id_project_id_fk CASCADE;

-- Add new constraints with CASCADE
ALTER TABLE room ADD CONSTRAINT room_project_id_project_id_fk
  FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE;

ALTER TABLE box ADD CONSTRAINT box_room_id_room_id_fk
  FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE CASCADE;

ALTER TABLE qr_code ADD CONSTRAINT qr_code_box_id_box_id_fk
  FOREIGN KEY (box_id) REFERENCES box(id) ON DELETE CASCADE;
