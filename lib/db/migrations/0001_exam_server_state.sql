ALTER TABLE "exams" ADD COLUMN "durasi_menit" integer;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "submitted_at" timestamp;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "retake_of_exam_id" uuid;--> statement-breakpoint
UPDATE "exams" SET "submitted_at" = "created_at" WHERE "submitted_at" IS NULL AND EXISTS (SELECT 1 FROM "exam_results" r WHERE r."exam_id" = "exams"."id");
