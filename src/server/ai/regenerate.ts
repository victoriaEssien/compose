/** Regenerating one slide, leaving the rest of the post alone (spec section 14). */
import "server-only";

import { slideGist, templates } from "@/templates";
import type { BrandKit } from "@/types/brand";
import { slideSpecSchema } from "@/types/slide";
import type { RegenerateAction, SlideSpec } from "@/types/slide";
import { openAiProvider } from "./openai";
import { regeneratePrompt } from "./prompts/regenerate.v1";
import type { AiProvider } from "./provider";
import { generateStructured } from "./structured";

/** These two are asked to pick a better template, so the whole union is allowed. */
const relayoutActions = new Set<RegenerateAction>(["change_layout", "another_design"]);

export async function regenerateSlide(
  args: {
    slide: SlideSpec;
    action: RegenerateAction;
    instruction: string | null;
    brand: BrandKit;
    postTitle: string;
    originalContent: string;
    otherSlides: SlideSpec[];
  },
  provider: AiProvider = openAiProvider(),
): Promise<SlideSpec> {
  const keepTemplate = !relayoutActions.has(args.action);

  const { system, user } = regeneratePrompt.build({
    slide: args.slide,
    action: args.action,
    instruction: args.instruction,
    brand: args.brand,
    postTitle: args.postTitle,
    originalContent: args.originalContent,
    neighbours: args.otherSlides.map((slide) => slideGist(slide).primary),
    keepTemplate,
  });

  return generateStructured(provider, {
    name: regeneratePrompt.version,
    system,
    user,
    schema: keepTemplate ? templates[args.slide.template].schema : slideSpecSchema,
  });
}
