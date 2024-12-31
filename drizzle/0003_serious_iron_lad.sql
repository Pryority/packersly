ALTER TABLE "room" DROP CONSTRAINT "room_project_id_project_id_fk";
--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;