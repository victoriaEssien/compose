/** Asset library reads and writes (spec section 16). */
import "server-only";
import { and, desc, eq } from "drizzle-orm";

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
