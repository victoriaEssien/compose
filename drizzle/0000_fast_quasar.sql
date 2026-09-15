CREATE TYPE "public"."asset_type" AS ENUM('screenshot', 'logo', 'avatar', 'illustration', 'photo', 'other');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('draft', 'ready', 'exported');--> statement-breakpoint
CREATE TYPE "public"."post_type" AS ENUM('educational', 'tutorial', 'project_showcase', 'things_i_learned', 'opinion', 'tool_recommendation', 'story');--> statement-breakpoint
CREATE TYPE "public"."template_kind" AS ENUM('cover', 'text', 'numbered_list', 'code', 'comparison', 'quote', 'screenshot', 'project', 'final');--> statement-breakpoint
CREATE TABLE "asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "asset_type" NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"logo_url" text,
	"avatar_url" text,
	"fonts" jsonb NOT NULL,
	"colors" jsonb NOT NULL,
	"style" jsonb NOT NULL,
	"voice" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"type" "post_type" NOT NULL,
	"status" "post_status" DEFAULT 'draft' NOT NULL,
	"original_content" text NOT NULL,
	"generated_content" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slide" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"order" smallint NOT NULL,
	"template" "template_kind" NOT NULL,
	"content" jsonb NOT NULL,
	"design_config" jsonb,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"kind" "template_kind" NOT NULL,
	"configuration" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "slide" ADD CONSTRAINT "slide_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "asset_user_id_idx" ON "asset" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "brand_user_id_idx" ON "brand" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "post_user_id_idx" ON "post" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "slide_post_id_order_idx" ON "slide" USING btree ("post_id","order");--> statement-breakpoint
CREATE INDEX "template_user_id_idx" ON "template" USING btree ("user_id");