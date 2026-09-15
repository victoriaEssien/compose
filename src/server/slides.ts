/** Slide edits (spec section 13). Every call proves the post belongs to the user. */
import "server-only";
import { and, asc, eq, gt, gte, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";

import type { SlideDesignConfig, SlideSpec } from "@/types/slide";
import { db } from "./db/client";
import { post, slide } from "./db/schema";
import { deleteUserFile } from "./storage/blob";

export async function ownsPost(userId: string, postId: string) {
  const [row] = await db()
    .select({ id: post.id })
    .from(post)
    .where(and(eq(post.id, postId), eq(post.userId, userId)))
    .limit(1);

  return Boolean(row);
}

export async function loadSlide(userId: string, postId: string, slideId: string) {
  if (!(await ownsPost(userId, postId))) return null;

  const [row] = await db()
    .select()
    .from(slide)
    .where(and(eq(slide.id, slideId), eq(slide.postId, postId)))
    .limit(1);

  return row ?? null;
}

export async function updateSlide(
  userId: string,
  postId: string,
  slideId: string,
  patch: { content: SlideSpec; designConfig: SlideDesignConfig | null },
) {
  if (!(await ownsPost(userId, postId))) return false;

  await db()
    .update(slide)
    .set({
      content: patch.content,
      template: patch.content.template,
      designConfig: patch.designConfig,
    })
    .where(and(eq(slide.id, slideId), eq(slide.postId, postId)));

  return true;
}

export async function duplicateSlide(userId: string, postId: string, slideId: string) {
  const source = await loadSlide(userId, postId, slideId);
  if (!source) return false;

  // Open a gap first so the copy lands directly after its original.
  await db()
    .update(slide)
    .set({ order: sql`${slide.order} + 1` })
    .where(and(eq(slide.postId, postId), gt(slide.order, source.order)));

  await db()
    .insert(slide)
    .values({
      postId,
      order: source.order + 1,
      template: source.template,
      content: source.content,
      designConfig: source.designConfig,
      imageUrl: source.imageUrl,
    });

  // Leaves orders at 0..n-1, so a tie can never survive a duplicate.
  await compactOrder(postId);

  return true;
}

export async function deleteSlide(userId: string, postId: string, slideId: string) {
  if (!(await ownsPost(userId, postId))) return false;

  const remaining = await db().select({ id: slide.id }).from(slide).where(eq(slide.postId, postId));

  // A post with no slides has nothing to render or export.
  if (remaining.length <= 1) return false;

  await db()
    .delete(slide)
    .where(and(eq(slide.id, slideId), eq(slide.postId, postId)));
  await compactOrder(postId);

  return true;
}

/**
 * Puts a slide back at a given position. Undo for a delete: the row is gone, but
 * its content came back from the client, and deleteSlide never touched the blob
 * so a generated illustration is still at the same URL.
 */
export async function insertSlideAt(
  userId: string,
  postId: string,
  at: number,
  data: { content: SlideSpec; designConfig: SlideDesignConfig | null; imageUrl: string | null },
) {
  if (!(await ownsPost(userId, postId))) return false;

  // Open the gap before inserting, so nothing shares the target order.
  await db()
    .update(slide)
    .set({ order: sql`${slide.order} + 1` })
    .where(and(eq(slide.postId, postId), gte(slide.order, at)));

  await db().insert(slide).values({
    postId,
    order: at,
    template: data.content.template,
    content: data.content,
    designConfig: data.designConfig,
    imageUrl: data.imageUrl,
  });

  await compactOrder(postId);

  return true;
}

/**
 * Relative, and resolved against the stored order rather than a list sent by the
 * client. Two quick clicks cannot then race on a stale copy of the slides.
 */
export async function moveSlide(
  userId: string,
  postId: string,
  slideId: string,
  direction: -1 | 1,
) {
  if (!(await ownsPost(userId, postId))) return false;

  const rows = await db()
    .select({ id: slide.id })
    .from(slide)
    .where(eq(slide.postId, postId))
    .orderBy(asc(slide.order), asc(slide.id));

  const from = rows.findIndex((row) => row.id === slideId);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= rows.length) return false;

  const ordered = rows.map((row) => row.id);
  [ordered[from], ordered[to]] = [ordered[to], ordered[from]];

  await writeOrder(postId, ordered);
  return true;
}

async function compactOrder(postId: string) {
  const rows = await db()
    .select({ id: slide.id })
    .from(slide)
    .where(eq(slide.postId, postId))
    .orderBy(asc(slide.order), asc(slide.id));

  await writeOrder(
    postId,
    rows.map((row) => row.id),
  );
}

async function writeOrder(postId: string, orderedIds: string[]) {
  const statements = orderedIds.map((id, index) =>
    db()
      .update(slide)
      .set({ order: index })
      .where(and(eq(slide.id, id), eq(slide.postId, postId))),
  );

  if (statements.length === 0) return;

  // batch() wants a non-empty tuple, which a mapped array cannot prove.
  await db().batch(statements as unknown as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
}

/** The generated illustration for a slide. Replacing one removes the old blob. */
export async function setSlideIllustration(
  userId: string,
  postId: string,
  slideId: string,
  imageUrl: string | null,
) {
  const current = await loadSlide(userId, postId, slideId);
  if (!current) return false;

  await db()
    .update(slide)
    .set({ imageUrl })
    .where(and(eq(slide.id, slideId), eq(slide.postId, postId)));

  if (current.imageUrl && current.imageUrl !== imageUrl) await deleteUserFile(current.imageUrl);

  return true;
}
