/**
 * Caption and hashtags for a finished post (spec section 20).
 *
 * The spec parks this with Instagram publishing, which is not being built. The
 * two are separable: the caption is worth the most at the export moment, where
 * the user would otherwise leave with a zip and write it from scratch.
 */
import "server-only";

import { slideGist } from "@/templates";
import type { BrandKit } from "@/types/brand";
import { captionSchema } from "@/types/caption";
import type { Caption } from "@/types/caption";
import type { SlideSpec } from "@/types/slide";
import { openAiProvider } from "./openai";
import { captionPrompt } from "./prompts/caption.v1";
import type { AiProvider } from "./provider";
import { generateStructured } from "./structured";

export async function generateCaption(
  args: {
    brand: BrandKit;
    postTitle: string;
    originalContent: string;
    slides: SlideSpec[];
  },
  provider: AiProvider = openAiProvider(),
): Promise<Caption> {
  const final = args.slides.find((slide) => slide.template === "final");

  const { system, user } = captionPrompt.build({
    brand: args.brand,
    postTitle: args.postTitle,
    originalContent: args.originalContent,
    slides: args.slides.map((slide) => slideGist(slide).primary),
    cta: final && final.template === "final" ? final.cta : null,
  });

  const result = await generateStructured(provider, {
    name: captionPrompt.version,
    system,
    user,
    schema: captionSchema,
  });

  // Models add the # about half the time, whatever the prompt says.
  return {
    caption: result.caption.trim(),
    hashtags: result.hashtags.map((tag) => tag.replace(/^#+/, "").trim()).filter(Boolean),
  };
}
