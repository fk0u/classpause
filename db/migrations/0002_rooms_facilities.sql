CREATE TYPE "public"."facility_kind" AS ENUM('marker', 'projector', 'ac', 'cleanliness', 'parking_full', 'other');--> statement-breakpoint
CREATE TABLE "facility_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place" text NOT NULL,
	"kind" "facility_kind" NOT NULL,
	"user_id" uuid NOT NULL,
	"confirms" integer DEFAULT 1 NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"user_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "facility_reports" ADD CONSTRAINT "facility_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_claims" ADD CONSTRAINT "room_claims_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_claims" ADD CONSTRAINT "room_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "facility_created_idx" ON "facility_reports" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "room_claims_slot_uq" ON "room_claims" USING btree ("room_id","starts_at");