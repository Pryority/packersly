ALTER TABLE "qr_code" ADD COLUMN "is_assigned" boolean DEFAULT false NOT NULL;
ALTER TABLE "qr_code" ADD COLUMN "is_pre_generated" boolean DEFAULT false NOT NULL;
