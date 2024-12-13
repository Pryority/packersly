CREATE TABLE IF NOT EXISTS "qr_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"box_id" uuid,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "qr_code_box_id_unique" UNIQUE("box_id")
);
--> statement-breakpoint
ALTER TABLE "box" DROP CONSTRAINT "box_qr_code_unique";--> statement-breakpoint
ALTER TABLE "box" DROP CONSTRAINT "box_room_id_room_id_fk";
--> statement-breakpoint
ALTER TABLE "box" ALTER COLUMN "room_id" DROP NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qr_code" ADD CONSTRAINT "qr_code_box_id_box_id_fk" FOREIGN KEY ("box_id") REFERENCES "public"."box"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "box" ADD CONSTRAINT "box_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "box" DROP COLUMN IF EXISTS "qr_code";