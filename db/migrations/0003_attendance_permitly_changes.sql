CREATE TYPE "public"."attendance_status" AS ENUM('present', 'permit', 'sick', 'absent', 'micropause');--> statement-breakpoint
CREATE TYPE "public"."change_status" AS ENUM('pending', 'confirmed', 'rejected', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."permission_status" ADD VALUE 'expired';--> statement-breakpoint
CREATE TABLE "attendance" (
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "attendance_status" NOT NULL,
	"source" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_session_id_user_id_pk" PRIMARY KEY("session_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "change_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"requested_by" uuid NOT NULL,
	"reason" text NOT NULL,
	"proposals" jsonb NOT NULL,
	"chosen" jsonb,
	"status" "change_status" DEFAULT 'pending' NOT NULL,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holidays" (
	"date" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "proof_path" text;--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "proof_name" text;--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "proof_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "proof_due_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "proof_reminded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "photo_path" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "photo_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "photo_reminded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "reminded_h1_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "reminded_h0_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attendance_user_idx" ON "attendance" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "change_requests_status_idx" ON "change_requests" USING btree ("status");