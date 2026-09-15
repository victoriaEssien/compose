/**
 * Saved looks (spec section 15): a slide's per-slide design overrides, kept by
 * name so they can be put on another slide.
 *
 * The `template` table has carried this shape since Phase 1 and nothing wrote to
 * it, so this needs no migration. It stores overrides only, never copy: a look
 * is a way for a post to stay consistent over time, not a content template.
 */
import "server-only";
import { and, desc, eq } from "drizzle-orm";

import type { SlideDesignConfig, TemplateKind } from "@/types/slide";
import { db } from "./db/client";
import { template } from "./db/schema";

/** Enough to be useful, few enough to stay a list you can read. */
export const maxSavedDesigns = 12;

export async function listSavedDesigns(userId: string) {
  return db()
    .select()
    .from(template)
    .where(eq(template.userId, userId))
    .orderBy(desc(template.updatedAt))
    .limit(maxSavedDesigns);
}

export async function countSavedDesigns(userId: string) {
  const rows = await db()
    .select({ id: template.id })
    .from(template)
    .where(eq(template.userId, userId));

  return rows.length;
}

export async function saveDesign(input: {
  userId: string;
  name: string;
  kind: TemplateKind;
  configuration: SlideDesignConfig;
}) {
  // A second save under the same name replaces it, which is what "save" means
  // to someone who is refining one look rather than collecting many.
  const [existing] = await db()
    .select({ id: template.id })
    .from(template)
    .where(and(eq(template.userId, input.userId), eq(template.name, input.name)))
    .limit(1);

  if (existing) {
    await db()
      .update(template)
      .set({ kind: input.kind, configuration: input.configuration })
      .where(eq(template.id, existing.id));

    return existing.id;
  }

  const [row] = await db().insert(template).values(input).returning({ id: template.id });
  return row.id;
}

export async function removeDesign(userId: string, id: string) {
  await db()
    .delete(template)
    .where(and(eq(template.id, id), eq(template.userId, userId)));
}
