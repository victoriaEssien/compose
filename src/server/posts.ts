/** Post reads and writes (spec sections 21 and 26). */
import "server-only";
import { and, desc, eq } from "drizzle-orm";

import type { GeneratePostInput, PostSpec } from "@/types/post";
import { db } from "./db/client";
import { post, slide } from "./db/schema";

export async function listRecentPosts(userId: string, limit = 6) {
  return db()
    .select()
    .from(post)
    .where(eq(post.userId, userId))
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
