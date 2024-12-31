-- drizzle/0004_break_dependencies.sql
ALTER TABLE room DROP CONSTRAINT room_project_id_project_id_fk;
ALTER TABLE box DROP CONSTRAINT box_room_id_room_id_fk;
ALTER TABLE qr_code DROP CONSTRAINT qr_code_box_id_box_id_fk;

ALTER TABLE room ADD CONSTRAINT room_project_id_project_id_fk
  FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE;
ALTER TABLE box ADD CONSTRAINT box_room_id_room_id_fk
  FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE CASCADE;
ALTER TABLE qr_code ADD CONSTRAINT qr_code_box_id_box_id_fk
  FOREIGN KEY (box_id) REFERENCES box(id) ON DELETE CASCADE;
