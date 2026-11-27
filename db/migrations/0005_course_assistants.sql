CREATE TABLE "course_assistants" (
	"class_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_assistants_class_id_user_id_pk" PRIMARY KEY("class_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "course_assistants" ADD CONSTRAINT "course_assistants_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_assistants" ADD CONSTRAINT "course_assistants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "course_assistants_user_idx" ON "course_assistants" USING btree ("user_id");