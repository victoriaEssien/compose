/**
 * Decorative illustrations for the visual hint. Never text: the renderer owns
 * every word on a slide (AGENTS.md).
 */
import "server-only";
import OpenAI from "openai";

import { env } from "@/lib/env";
import type { BrandKit, IllustrationStyle } from "@/types/brand";

export const illustrationModel = "gpt-image-1-mini";

const styleBriefs: Record<IllustrationStyle, string | null> = {
  none: null,
  line: "a stroke-only outline icon with uniform stroke weight, rounded caps and no fill",
  flat: "a flat vector icon built from solid filled shapes",
  isometric: "a simple isometric vector icon built from flat solid faces",
  three_d: "a matte 3D icon with simple geometry and flat shading",
};

export type IllustrationResult =
  { ok: true; bytes: Buffer; contentType: string } | { ok: false; error: string };

let client: OpenAI | undefined;

function openai() {
  if (!client) client = new OpenAI({ apiKey: env().OPENAI_API_KEY });
  return client;
}

export function illustrationPrompt(hint: string, brand: BrandKit) {
  const style = styleBriefs[brand.style.illustration];

  return [
    `A single pictogram representing "${hint.replaceAll("_", " ")}", drawn as ${style}.`,
    "It must look like one icon exported from a vector editor as a flat SVG, in the style of Lucide or Feather.",
    `Every stroke and shape is exactly the solid colour ${brand.colors.accent}, with no other colour anywhere.`,
    "The background is fully transparent: no panel, card, circle or container behind the subject.",
    "One subject, centred, filling most of the frame.",
    "Perfectly flat rendering. No glow, bloom, neon, halo, shadow, gradient, texture, lighting or depth.",
    "No text, letters, numbers, labels, logos, watermarks or user interface chrome.",
  ].join(" ");
}

export async function generateIllustration(
  hint: string,
  brand: BrandKit,
): Promise<IllustrationResult> {
  if (brand.style.illustration === "none") {
    return { ok: false, error: "Your Brand Kit illustration style is set to None." };
  }

  const response = await openai().images.generate({
    model: illustrationModel,
    prompt: illustrationPrompt(hint, brand),
    size: "1024x1024",
    // low quality ignores the flat-style instructions and returns neon glow.
    quality: "medium",
    output_format: "png",
    // Transparent so the illustration sits on the brand background, whatever it is.
    background: "transparent",
    n: 1,
  });

  const encoded = response.data?.[0]?.b64_json;
  if (!encoded) return { ok: false, error: "The image model returned nothing." };

  return { ok: true, bytes: Buffer.from(encoded, "base64"), contentType: "image/png" };
}
