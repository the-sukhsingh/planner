CREATE TABLE "uploads_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"conversation_id" integer,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_url" text NOT NULL,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "uploads_table" ADD CONSTRAINT "uploads_table_user_id_users_table_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_table"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads_table" ADD CONSTRAINT "uploads_table_conversation_id_conversations_table_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations_table"("id") ON DELETE set null ON UPDATE no action;