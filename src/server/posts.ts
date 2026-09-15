/** Post reads and writes (spec sections 21 and 26). */
import "server-only";
import { and, desc, eq, ne, sql } from "drizzle-orm";

import type { GeneratePostInput, PostSpec, PostStatus } from "@/types/post";
import { db } from "./db/client";
import { post, slide } from "./db/schema";

/** Everything past the draft stage, so the dashboard does not list a post twice. */
export async function listRecentPosts(userId: string, limit = 6) {
  return db()
    .select()
    .from(post)
    .where(and(eq(post.userId, userId), ne(post.status, "draft")))
    .orderBy(desc(post.updatedAt))
    .limit(limit);
}

export async function listDrafts(userId: string, limit = 6) {
  return db()
    .select()
    .from(post)
    .where(and(eq(post.userId, userId), eq(post.status, "draft")))
    .orderBy(desc(post.updatedAt))
    .limit(limit);
}

/**
 * The neon-http driver has no interactive transactions, so the id is generated
 * here and both inserts go out as one atomic batch.
 */
export async function createPostFromSpec(args: {
  userId: string;
  input: GeneratePostInput;
  spec: PostSpec;
}) {
  const postId = crypto.randomUUID();

  await db().batch([
    db().insert(post).values({
      id: postId,
      userId: args.userId,
      title: args.spec.title,
      type: args.spec.postType,
      status: "draft",
      originalContent: args.input.content,
      generatedContent: args.spec,
    }),
    db()
      .insert(slide)
      .values(
        args.spec.slides.map((content, index) => ({
          postId,
          order: index,
          template: content.template,
          content,
        })),
      ),
  ]);

  return postId;
}

export async function loadPost(userId: string, postId: string) {
  const [row] = await db()
    .select()
    .from(post)
    .where(and(eq(post.id, postId), eq(post.userId, userId)))
    .limit(1);

  if (!row) return null;

  const slides = await db()
    .select()
    .from(slide)
    .where(eq(slide.postId, postId))
    .orderBy(slide.order);

  return { post: row, slides };
}

export async function setPostStatus(userId: string, postId: string, status: PostStatus) {
  const [row] = await db()
    .update(post)
    .set({ status })
    .where(and(eq(post.id, postId), eq(post.userId, userId)))
    .returning({ id: post.id });

  return Boolean(row);
}

/** coalesce keeps the first download stamped, so the metric stays honest. */
export async function markExported(userId: string, postId: string) {
  await db()
    .update(post)
    .set({ status: "exported", firstExportedAt: sql`coalesce(${post.firstExportedAt}, now())` })
    .where(and(eq(post.id, postId), eq(post.userId, userId)));
}

/** Spec section 34: idea to export, and how many generated posts actually ship. */
export async function postMetrics(userId: string) {
  const rows = await db()
    .select({ createdAt: post.createdAt, firstExportedAt: post.firstExportedAt })
    .from(post)
    .where(eq(post.userId, userId));

  const durations = rows
    .filter((row) => row.firstExportedAt)
    .map((row) => row.firstExportedAt!.getTime() - row.createdAt.getTime())
    .sort((a, b) => a - b);

  return {
    generated: rows.length,
    exported: durations.length,
    medianMsToExport: durations.length ? durations[Math.floor(durations.length / 2)] : null,
  };
}
