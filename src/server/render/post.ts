/** Everything a post needs before its slides can be drawn. */
import "server-only";

import type { SlideFormat } from "@/templates";
import { slideFormats } from "@/templates";
import { loadAssetUrls } from "@/server/assets";
import { loadBrandKit } from "@/server/brand";
import { loadPost } from "@/server/posts";
import type { SlideInput } from "./slide";

export function parseFormat(value: string | null): SlideFormat {
  return slideFormats.find((format) => format === value) ?? "carousel";
}

export async function loadRenderablePost(userId: string, postId: string) {
  const found = await loadPost(userId, postId);
  if (!found) return null;

  const assetIds = found.slides.flatMap((row) =>
    "assetId" in row.content && row.content.assetId ? [row.content.assetId] : [],
  );

  const [brand, assetUrls] = await Promise.all([
    loadBrandKit(userId),
    loadAssetUrls(userId, assetIds),
  ]);

  const inputs: SlideInput[] = found.slides.map((row, index) => ({
    content: row.content,
    designConfig: row.designConfig,
    imageUrl: row.imageUrl,
    index,
  }));

  return { post: found.post, slides: found.slides, inputs, brand, assetUrls };
}
