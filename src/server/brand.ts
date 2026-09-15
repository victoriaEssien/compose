/** Brand Kit reads and writes (spec sections 10, 15 and 27). */
import "server-only";
import { eq } from "drizzle-orm";

import { defaultBrandKit } from "@/types/brand";
import type { BrandKit } from "@/types/brand";
import { db } from "./db/client";
import { brand } from "./db/schema";

function toBrandKit(row: typeof brand.$inferSelect): BrandKit {
  return {
    name: row.name,
    username: row.username,
    logoUrl: row.logoUrl,
    avatarUrl: row.avatarUrl,
    fonts: row.fonts,
    colors: row.colors,
    style: row.style,
    voice: row.voice,
  };
}

/** Falls back to the defaults so the renderer and AI always have a kit to work from. */
export async function loadBrandKit(userId: string): Promise<BrandKit> {
  const [row] = await db().select().from(brand).where(eq(brand.userId, userId)).limit(1);
  return row ? toBrandKit(row) : defaultBrandKit;
}

export async function seedBrandKit(userId: string) {
  await db()
    .insert(brand)
    .values({ userId, ...defaultBrandKit })
    .onConflictDoNothing();
}

export async function saveBrandKit(userId: string, kit: BrandKit) {
  await db()
    .insert(brand)
    .values({ userId, ...kit })
    .onConflictDoUpdate({ target: brand.userId, set: kit });
}
