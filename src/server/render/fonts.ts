/**
 * Satori needs raw font bytes. They live under public/ so the browser preview can
 * load the same files through @font-face and match the PNG exactly.
 */
import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";

import type { BrandKit, FontFamily } from "@/types/brand";

const slugs: Record<FontFamily, string> = {
  Inter: "inter",
  "Space Grotesk": "space-grotesk",
  "IBM Plex Sans": "ibm-plex-sans",
  "Playfair Display": "playfair-display",
  "JetBrains Mono": "jetbrains-mono",
};

/** Code is always mono, whatever the Brand Kit says. The renderer owns this. */
export const codeFontFamily: FontFamily = "JetBrains Mono";

/**
 * The files the browser preview will ask for. @font-face is lazy, so without a
 * preload the fetch only starts after CSS parse and first layout, and the
 * preview paints in a fallback face first.
 */
export function brandFontUrls(brand: BrandKit) {
  const families = new Set<FontFamily>([brand.fonts.primary, brand.fonts.secondary]);

  return [...families].flatMap((family) =>
    weights.map((weight) => `/fonts/${slugs[family]}-${weight}.ttf`),
  );
}

const weights = [400, 700] as const;
const cache = new Map<string, Buffer>();

function load(family: FontFamily, weight: (typeof weights)[number]) {
  const key = `${slugs[family]}-${weight}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const bytes = readFileSync(path.join(process.cwd(), "public", "fonts", `${key}.ttf`));
  cache.set(key, bytes);
  return bytes;
}

export function satoriFonts(brand: BrandKit) {
  const families = new Set<FontFamily>([
    brand.fonts.primary,
    brand.fonts.secondary,
    codeFontFamily,
  ]);

  return [...families].flatMap((family) =>
    weights.map((weight) => ({
      name: family,
      data: load(family, weight),
      weight,
      style: "normal" as const,
    })),
  );
}
