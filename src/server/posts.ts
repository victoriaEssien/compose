/** Post reads for the dashboard (spec section 21). */
import "server-only";
import { and, desc, eq } from "drizzle-orm";

import { db } from "./db/client";
import { post } from "./db/schema";

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
