/** Asset library reads and writes (spec section 16). */
import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";

import type { AssetType } from "@/types/asset";
import { db } from "./db/client";
import { asset } from "./db/schema";
import { deleteUserFile } from "./storage/blob";

export async function listAssets(userId: string) {
  return db().select().from(asset).where(eq(asset.userId, userId)).orderBy(desc(asset.createdAt));
}

export async function createAsset(input: {
  userId: string;
  name: string;
  type: AssetType;
  url: string;
}) {
  const [row] = await db().insert(asset).values(input).returning();
  return row;
}

export async function renameAsset(userId: string, id: string, name: string) {
  await db()
    .update(asset)
    .set({ name })
    .where(and(eq(asset.id, id), eq(asset.userId, userId)));
}

/** Removes the blob too, so the store does not accumulate orphans. */
export async function removeAsset(userId: string, id: string) {
  const [row] = await db()
    .delete(asset)
    .where(and(eq(asset.id, id), eq(asset.userId, userId)))
    .returning();

  if (row) await deleteUserFile(row.url);
}

/** Slides store an assetId; the renderer needs the URL behind it. */
export async function loadAssetUrls(userId: string, ids: string[]) {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map<string, string>();

  const rows = await db()
    .select({ id: asset.id, url: asset.url })
    .from(asset)
    .where(and(eq(asset.userId, userId), inArray(asset.id, unique)));

  return new Map(rows.map((row) => [row.id, row.url]));
}
