CREATE TYPE "auth_provider" AS ENUM('google');--> statement-breakpoint
CREATE TYPE "block_type" AS ENUM('paragraph', 'heading1', 'heading2', 'heading3', 'bulleted_list', 'numbered_list', 'todo', 'quote', 'code', 'divider', 'image', 'link');--> statement-breakpoint
CREATE TYPE "reading_status" AS ENUM('want_to_read', 'reading', 'finished');--> statement-breakpoint
CREATE TYPE "resource_type" AS ENUM('book', 'article', 'documentation', 'link', 'other');--> statement-breakpoint
CREATE TYPE "search_entity_type" AS ENUM('page', 'resource', 'highlight', 'journal_entry');--> statement-breakpoint
CREATE TYPE "verification_channel" AS ENUM('email', 'sms');--> statement-breakpoint
CREATE TYPE "verification_purpose" AS ENUM('verify_email', 'verify_phone', 'login_otp', 'reset_password');--> statement-breakpoint
CREATE TYPE "workspace_kind" AS ENUM('personal', 'team');--> statement-breakpoint
CREATE TYPE "workspace_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"workspace_id" uuid NOT NULL,
	"storage_key" text NOT NULL CONSTRAINT "assets_storage_key_key" UNIQUE,
	"mime_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"width" integer,
	"height" integer,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assets_workspace_id_key" UNIQUE("workspace_id","id"),
	CONSTRAINT "assets_size_check" CHECK ("size_bytes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "auth_identities" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"user_id" uuid NOT NULL,
	"provider" "auth_provider" NOT NULL,
	"provider_user_id" text NOT NULL,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_identities_provider_user_key" UNIQUE("provider","provider_user_id")
);
--> statement-breakpoint
CREATE TABLE "blocks" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"workspace_id" uuid NOT NULL,
	"page_id" uuid NOT NULL,
	"parent_block_id" uuid,
	"type" "block_type" NOT NULL,
	"content" jsonb DEFAULT '{}' NOT NULL,
	"position" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocks_page_id_key" UNIQUE("page_id","id"),
	CONSTRAINT "blocks_version_check" CHECK ("version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "book_details" (
	"resource_id" uuid PRIMARY KEY,
	"isbn" text,
	"publisher" text,
	"published_year" smallint,
	"page_count" integer,
	"current_page" integer,
	CONSTRAINT "book_details_page_count_check" CHECK ("page_count" is null or "page_count" > 0),
	CONSTRAINT "book_details_current_page_check" CHECK ("current_page" is null or "current_page" >= 0)
);
--> statement-breakpoint
CREATE TABLE "collection_pages" (
	"workspace_id" uuid NOT NULL,
	"collection_id" uuid,
	"page_id" uuid,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collection_pages_pkey" PRIMARY KEY("collection_id","page_id")
);
--> statement-breakpoint
CREATE TABLE "collection_resources" (
	"workspace_id" uuid NOT NULL,
	"collection_id" uuid,
	"resource_id" uuid,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collection_resources_pkey" PRIMARY KEY("collection_id","resource_id")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"position" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collections_workspace_id_key" UNIQUE("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "highlight_links" (
	"workspace_id" uuid NOT NULL,
	"highlight_id" uuid,
	"page_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "highlight_links_pkey" PRIMARY KEY("highlight_id","page_id")
);
--> statement-breakpoint
CREATE TABLE "highlight_tags" (
	"workspace_id" uuid NOT NULL,
	"highlight_id" uuid,
	"tag_id" uuid,
	CONSTRAINT "highlight_tags_pkey" PRIMARY KEY("highlight_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "highlights" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"workspace_id" uuid NOT NULL,
	"resource_id" uuid NOT NULL,
	"text" text NOT NULL,
	"note" text,
	"chapter" text,
	"page_number" integer,
	"location" jsonb,
	"color" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "highlights_workspace_id_key" UNIQUE("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"entry_date" date NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"learned" text DEFAULT '' NOT NULL,
	"challenges" text DEFAULT '' NOT NULL,
	"reflection" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "journal_entries_workspace_id_key" UNIQUE("workspace_id","id"),
	CONSTRAINT "journal_entries_one_per_day" UNIQUE("workspace_id","user_id","entry_date")
);
--> statement-breakpoint
CREATE TABLE "journal_entry_tags" (
	"workspace_id" uuid NOT NULL,
	"journal_entry_id" uuid,
	"tag_id" uuid,
	CONSTRAINT "journal_entry_tags_pkey" PRIMARY KEY("journal_entry_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "page_favorites" (
	"user_id" uuid,
	"workspace_id" uuid NOT NULL,
	"page_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "page_favorites_pkey" PRIMARY KEY("user_id","page_id")
);
--> statement-breakpoint
CREATE TABLE "page_tags" (
	"workspace_id" uuid NOT NULL,
	"page_id" uuid,
	"tag_id" uuid,
	CONSTRAINT "page_tags_pkey" PRIMARY KEY("page_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"workspace_id" uuid NOT NULL,
	"parent_id" uuid,
	"title" text DEFAULT '' NOT NULL,
	"icon" text,
	"position" text NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"archived_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pages_workspace_id_key" UNIQUE("workspace_id","id"),
	CONSTRAINT "pages_not_own_parent" CHECK ("parent_id" is null or "parent_id" <> "id")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"user_id" uuid NOT NULL,
	"family_id" uuid NOT NULL,
	"token_hash" text NOT NULL CONSTRAINT "refresh_tokens_token_hash_key" UNIQUE,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"replaced_by_id" uuid,
	"user_agent" text,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_tags" (
	"workspace_id" uuid NOT NULL,
	"resource_id" uuid,
	"tag_id" uuid,
	CONSTRAINT "resource_tags_pkey" PRIMARY KEY("resource_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"workspace_id" uuid NOT NULL,
	"type" "resource_type" NOT NULL,
	"title" text NOT NULL,
	"authors" text[] DEFAULT '{}'::text[] NOT NULL,
	"url" text,
	"description" text,
	"cover_asset_id" uuid,
	"status" "reading_status" DEFAULT 'want_to_read'::"reading_status" NOT NULL,
	"started_on" date,
	"finished_on" date,
	"rating" smallint,
	"progress" smallint,
	"created_by" uuid,
	"archived_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resources_workspace_id_key" UNIQUE("workspace_id","id"),
	CONSTRAINT "resources_rating_check" CHECK ("rating" between 1 and 5),
	CONSTRAINT "resources_progress_check" CHECK ("progress" between 0 and 100),
	CONSTRAINT "resources_dates_check" CHECK ("finished_on" is null or "started_on" is null or "finished_on" >= "started_on")
);
--> statement-breakpoint
CREATE TABLE "search_documents" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"workspace_id" uuid NOT NULL,
	"entity_type" "search_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"tag_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"collection_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"search_vector" tsvector GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce("title", '')), 'A') || setweight(to_tsvector('english', coalesce("body", '')), 'B')) STORED NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "search_documents_entity_key" UNIQUE("entity_type","entity_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_workspace_id_key" UNIQUE("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"email" text,
	"email_verified_at" timestamp with time zone,
	"phone" text,
	"phone_verified_at" timestamp with time zone,
	"password_hash" text,
	"name" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_has_contact" CHECK ("email" is not null or "phone" is not null)
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"user_id" uuid,
	"channel" "verification_channel" NOT NULL,
	"target" text NOT NULL,
	"purpose" "verification_purpose" NOT NULL,
	"code_hash" text NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "verification_codes_attempts_check" CHECK ("attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"workspace_id" uuid,
	"user_id" uuid,
	"role" "workspace_role" DEFAULT 'member'::"workspace_role" NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_members_pkey" PRIMARY KEY("workspace_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"name" text NOT NULL,
	"kind" "workspace_kind" NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "auth_identities_user_idx" ON "auth_identities" ("user_id");--> statement-breakpoint
CREATE INDEX "blocks_page_order_idx" ON "blocks" ("page_id","parent_block_id","position");--> statement-breakpoint
CREATE INDEX "collection_pages_page_idx" ON "collection_pages" ("page_id");--> statement-breakpoint
CREATE INDEX "collection_resources_resource_idx" ON "collection_resources" ("resource_id");--> statement-breakpoint
CREATE INDEX "collections_order_idx" ON "collections" ("workspace_id","position");--> statement-breakpoint
CREATE INDEX "highlight_links_page_idx" ON "highlight_links" ("page_id");--> statement-breakpoint
CREATE INDEX "highlight_tags_tag_idx" ON "highlight_tags" ("tag_id");--> statement-breakpoint
CREATE INDEX "highlights_resource_idx" ON "highlights" ("resource_id","created_at");--> statement-breakpoint
CREATE INDEX "highlights_recent_idx" ON "highlights" ("workspace_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "journal_entry_tags_tag_idx" ON "journal_entry_tags" ("tag_id");--> statement-breakpoint
CREATE INDEX "page_favorites_user_workspace_idx" ON "page_favorites" ("user_id","workspace_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "page_tags_tag_idx" ON "page_tags" ("tag_id");--> statement-breakpoint
CREATE INDEX "pages_tree_idx" ON "pages" ("workspace_id","parent_id","position") WHERE "deleted_at" is null;--> statement-breakpoint
CREATE INDEX "pages_recent_idx" ON "pages" ("workspace_id","updated_at" DESC NULLS LAST) WHERE "deleted_at" is null;--> statement-breakpoint
CREATE INDEX "pages_trash_idx" ON "pages" ("workspace_id","deleted_at") WHERE "deleted_at" is not null;--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_idx" ON "refresh_tokens" ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_family_idx" ON "refresh_tokens" ("family_id");--> statement-breakpoint
CREATE INDEX "resource_tags_tag_idx" ON "resource_tags" ("tag_id");--> statement-breakpoint
CREATE INDEX "resources_library_idx" ON "resources" ("workspace_id","type","status","updated_at" DESC NULLS LAST) WHERE "deleted_at" is null;--> statement-breakpoint
CREATE INDEX "search_documents_vector_idx" ON "search_documents" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "search_documents_tags_idx" ON "search_documents" USING gin ("tag_ids");--> statement-breakpoint
CREATE INDEX "search_documents_collections_idx" ON "search_documents" USING gin ("collection_ids");--> statement-breakpoint
CREATE INDEX "search_documents_workspace_type_idx" ON "search_documents" ("workspace_id","entity_type");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_workspace_name_key" ON "tags" ("workspace_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_key" ON "users" (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_key" ON "users" ("phone");--> statement-breakpoint
CREATE INDEX "verification_codes_target_idx" ON "verification_codes" ("target","purpose","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "workspace_members_user_idx" ON "workspace_members" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_one_personal_per_user" ON "workspaces" ("created_by") WHERE "kind" = 'personal';--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_uploaded_by_users_id_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "auth_identities" ADD CONSTRAINT "auth_identities_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_page_fk" FOREIGN KEY ("workspace_id","page_id") REFERENCES "pages"("workspace_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_parent_fk" FOREIGN KEY ("page_id","parent_block_id") REFERENCES "blocks"("page_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "book_details" ADD CONSTRAINT "book_details_resource_id_resources_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "collection_pages" ADD CONSTRAINT "collection_pages_collection_fk" FOREIGN KEY ("workspace_id","collection_id") REFERENCES "collections"("workspace_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "collection_pages" ADD CONSTRAINT "collection_pages_page_fk" FOREIGN KEY ("workspace_id","page_id") REFERENCES "pages"("workspace_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "collection_resources" ADD CONSTRAINT "collection_resources_collection_fk" FOREIGN KEY ("workspace_id","collection_id") REFERENCES "collections"("workspace_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "collection_resources" ADD CONSTRAINT "collection_resources_resource_fk" FOREIGN KEY ("workspace_id","resource_id") REFERENCES "resources"("workspace_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "highlight_links" ADD CONSTRAINT "highlight_links_highlight_fk" FOREIGN KEY ("workspace_id","highlight_id") REFERENCES "highlights"("workspace_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "highlight_links" ADD CONSTRAINT "highlight_links_page_fk" FOREIGN KEY ("workspace_id","page_id") REFERENCES "pages"("workspace_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "highlight_tags" ADD CONSTRAINT "highlight_tags_highlight_fk" FOREIGN KEY ("workspace_id","highlight_id") REFERENCES "highlights"("workspace_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "highlight_tags" ADD CONSTRAINT "highlight_tags_tag_fk" FOREIGN KEY ("workspace_id","tag_id") REFERENCES "tags"("workspace_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_resource_fk" FOREIGN KEY ("workspace_id","resource_id") REFERENCES "resources"("workspace_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "journal_entry_tags" ADD CONSTRAINT "journal_entry_tags_entry_fk" FOREIGN KEY ("workspace_id","journal_entry_id") REFERENCES "journal_entries"("workspace_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "journal_entry_tags" ADD CONSTRAINT "journal_entry_tags_tag_fk" FOREIGN KEY ("workspace_id","tag_id") REFERENCES "tags"("workspace_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "page_favorites" ADD CONSTRAINT "page_favorites_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "page_favorites" ADD CONSTRAINT "page_favorites_page_fk" FOREIGN KEY ("workspace_id","page_id") REFERENCES "pages"("workspace_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "page_tags" ADD CONSTRAINT "page_tags_page_fk" FOREIGN KEY ("workspace_id","page_id") REFERENCES "pages"("workspace_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "page_tags" ADD CONSTRAINT "page_tags_tag_fk" FOREIGN KEY ("workspace_id","tag_id") REFERENCES "tags"("workspace_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_updated_by_users_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_parent_fk" FOREIGN KEY ("workspace_id","parent_id") REFERENCES "pages"("workspace_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_replaced_by_fk" FOREIGN KEY ("replaced_by_id") REFERENCES "refresh_tokens"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "resource_tags" ADD CONSTRAINT "resource_tags_resource_fk" FOREIGN KEY ("workspace_id","resource_id") REFERENCES "resources"("workspace_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "resource_tags" ADD CONSTRAINT "resource_tags_tag_fk" FOREIGN KEY ("workspace_id","tag_id") REFERENCES "tags"("workspace_id","id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_cover_asset_fk" FOREIGN KEY ("workspace_id","cover_asset_id") REFERENCES "assets"("workspace_id","id");--> statement-breakpoint
ALTER TABLE "search_documents" ADD CONSTRAINT "search_documents_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL;