/** Drizzle schema: Better Auth tables (spec section 25) plus the app tables. */
import { relations } from "drizzle-orm";
import {
  boolean,
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

// Better Auth owns the four tables below and writes their timestamps itself, so
// they deliberately skip the $onUpdate trigger the app tables use.

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text().primaryKey(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  token: text().notNull().unique(),
  ipAddress: text(),
  userAgent: text(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull(),
});

export const account = pgTable("account", {
  id: text().primaryKey(),
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp({ withTimezone: true }),
  refreshTokenExpiresAt: timestamp({ withTimezone: true }),
  scope: text(),
  password: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull(),
});

export const verification = pgTable("verification", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** One Brand Kit per user: "Each user has a Brand Kit" (spec section 10). */
export const brand = pgTable(
  "brand",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
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
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
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
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
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
    userId: text().references(() => user.id, { onDelete: "cascade" }),
    name: text().notNull(),
    kind: templateKindEnum().notNull(),
    configuration: jsonb().$type<SlideDesignConfig>().notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [index("template_user_id_idx").on(t.userId)],
);

export const userRelations = relations(user, ({ many, one }) => ({
  brand: one(brand, { fields: [user.id], references: [brand.userId] }),
  assets: many(asset),
  posts: many(post),
}));

export const brandRelations = relations(brand, ({ one }) => ({
  user: one(user, { fields: [brand.userId], references: [user.id] }),
}));

export const assetRelations = relations(asset, ({ one }) => ({
  user: one(user, { fields: [asset.userId], references: [user.id] }),
}));

export const postRelations = relations(post, ({ many, one }) => ({
  user: one(user, { fields: [post.userId], references: [user.id] }),
  slides: many(slide),
}));

export const slideRelations = relations(slide, ({ one }) => ({
  post: one(post, { fields: [slide.postId], references: [post.id] }),
}));

export type UserRow = typeof user.$inferSelect;
export type BrandRow = typeof brand.$inferSelect;
export type AssetRow = typeof asset.$inferSelect;
export type PostRow = typeof post.$inferSelect;
export type SlideRow = typeof slide.$inferSelect;
export type TemplateRow = typeof template.$inferSelect;
