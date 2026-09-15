/**
 * Drizzle schema (spec section 25). `userId` has no foreign key yet: Better
 * Auth owns the `user` table and generates it in Phase 2.
 */
import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { assetTypes } from "@/types/asset";
import type { BrandColors, BrandFonts, BrandStyle } from "@/types/brand";
import { postStatuses, postTypes } from "@/types/post";
import type { PostSpec } from "@/types/post";
import { templateKinds } from "@/types/slide";
import type { SlideDesignConfig, SlideSpec } from "@/types/slide";

export const postTypeEnum = pgEnum("post_type", postTypes);
export const postStatusEnum = pgEnum("post_status", postStatuses);
export const templateKindEnum = pgEnum("template_kind", templateKinds);
export const assetTypeEnum = pgEnum("asset_type", assetTypes);

const createdAt = timestamp({ withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp({ withTimezone: true })
  .notNull()
  .defaultNow()
  .$onUpdate(() => new Date());

/** One Brand Kit per user: "Each user has a Brand Kit" (spec section 10). */
export const brand = pgTable(
  "brand",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text().notNull(),
    name: text().notNull(),
    username: text().notNull(),
    logoUrl: text(),
    avatarUrl: text(),
    fonts: jsonb().$type<BrandFonts>().notNull(),
    colors: jsonb().$type<BrandColors>().notNull(),
    style: jsonb().$type<BrandStyle>().notNull(),
    voice: text(),
    createdAt,
    updatedAt,
  },
  (t) => [uniqueIndex("brand_user_id_idx").on(t.userId)],
);

export const asset = pgTable(
  "asset",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text().notNull(),
    name: text().notNull(),
    type: assetTypeEnum().notNull(),
    url: text().notNull(),
    createdAt,
  },
  (t) => [index("asset_user_id_idx").on(t.userId)],
);

export const post = pgTable(
  "post",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text().notNull(),
    title: text().notNull(),
    /** The resolved type. "auto" is an input choice, never a stored value. */
    type: postTypeEnum().notNull(),
    status: postStatusEnum().notNull().default("draft"),
    originalContent: text().notNull(),
    /** The validated PostSpec as generated, kept for regeneration and diffing. */
    generatedContent: jsonb().$type<PostSpec>(),
    createdAt,
    updatedAt,
  },
  (t) => [index("post_user_id_idx").on(t.userId)],
);

export const slide = pgTable(
  "slide",
  {
    id: uuid().primaryKey().defaultRandom(),
    postId: uuid()
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    order: smallint().notNull(),
    /** Mirrors `content.template` so slides can be queried by layout. */
    template: templateKindEnum().notNull(),
    content: jsonb().$type<SlideSpec>().notNull(),
    designConfig: jsonb().$type<SlideDesignConfig>(),
    imageUrl: text(),
    createdAt,
    updatedAt,
  },
  // Not unique: reordering (Phase 7) swaps positions without a temporary value.
  (t) => [index("slide_post_id_order_idx").on(t.postId, t.order)],
);

/** Reusable saved designs (spec sections 15 and 25). Null userId means built-in. */
export const template = pgTable(
  "template",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text(),
    name: text().notNull(),
    kind: templateKindEnum().notNull(),
    configuration: jsonb().$type<SlideDesignConfig>().notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [index("template_user_id_idx").on(t.userId)],
);

export const postRelations = relations(post, ({ many }) => ({
  slides: many(slide),
}));

export const slideRelations = relations(slide, ({ one }) => ({
  post: one(post, { fields: [slide.postId], references: [post.id] }),
}));

export type BrandRow = typeof brand.$inferSelect;
export type AssetRow = typeof asset.$inferSelect;
export type PostRow = typeof post.$inferSelect;
export type SlideRow = typeof slide.$inferSelect;
export type TemplateRow = typeof template.$inferSelect;
