/** analyze -> structure -> plan -> validated PostSpec (spec section 26). */
import "server-only";
import type { BrandKit } from "@/types/brand";
import type { GeneratePostInput, PostSpec } from "@/types/post";
import { analyzeContent } from "./analyzer";
import { openAiProvider } from "./openai";
import { planDesign } from "./planner";
import type { AiProvider } from "./provider";
import type { ContentAnalysis, ContentStructure } from "./schemas";
import { structureContent } from "./structurer";

export type GeneratedPost = {
  analysis: ContentAnalysis;
  structure: ContentStructure;
  spec: PostSpec;
};

export async function generatePost(
  input: GeneratePostInput,
  brand: BrandKit,
  provider: AiProvider = openAiProvider(),
): Promise<GeneratedPost> {
  const analysis = await analyzeContent(provider, input, brand);
  const structure = await structureContent(provider, input, analysis, brand);
  const spec = await planDesign(provider, input, analysis, structure, brand);

  return { analysis, structure, spec };
}
