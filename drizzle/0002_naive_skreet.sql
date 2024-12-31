ALTER TABLE "qr_code" ADD COLUMN "room_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "qr_code" ADD COLUMN "is_assigned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "qr_code" ADD COLUMN "is_pre_generated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "qr_code" ADD CONSTRAINT "qr_code_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE cascade ON UPDATE no action;