/** Design Planner (spec section 17). Only registered templates can survive the schema. */
import "server-only";
import type { BrandKit } from "@/types/brand";
import { postSpecSchema } from "@/types/post";
import type { GeneratePostInput, PostSpec } from "@/types/post";
import { planPrompt } from "./prompts/plan.v1";
import type { AiProvider } from "./provider";
import type { ContentAnalysis, ContentStructure } from "./schemas";
import { generateStructured } from "./structured";

/** Spec section 9: the carousel opens on a hook and closes on a takeaway. */
export const plannedPostSchema = postSpecSchema
  .refine((spec) => spec.slides[0]?.template === "cover", {
    message: "the first slide must use the cover template",
    path: ["slides", 0, "template"],
  })
  .refine((spec) => spec.slides.length === 1 || spec.slides.at(-1)?.template === "final", {
    message: "the last slide must use the final template",
    path: ["slides"],
  });

export async function planDesign(
  provider: AiProvider,
  input: GeneratePostInput,
  analysis: ContentAnalysis,
  structure: ContentStructure,
  brand: BrandKit,
): Promise<PostSpec> {
  const { system, user } = planPrompt.build(input, analysis, structure, brand);

  return generateStructured(provider, {
    name: planPrompt.version,
    system,
    user,
    schema: plannedPostSchema,
  });
}
