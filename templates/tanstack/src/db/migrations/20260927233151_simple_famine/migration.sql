CREATE TABLE "cache_entries" (
	"key" text PRIMARY KEY,
	"value" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "cache_entries_expires_at_index" ON "cache_entries" ("expires_at");