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

/** The three model calls, so a caller can say which one is running. */
export const generateStages = ["analyze", "structure", "plan"] as const;
export type GenerateStage = (typeof generateStages)[number];

export async function generatePost(
  input: GeneratePostInput,
  brand: BrandKit,
  provider: AiProvider = openAiProvider(),
  onStage?: (stage: GenerateStage) => void,
): Promise<GeneratedPost> {
  onStage?.("analyze");
  const analysis = await analyzeContent(provider, input, brand);

  onStage?.("structure");
  const structure = await structureContent(provider, input, analysis, brand);

  onStage?.("plan");
  const spec = await planDesign(provider, input, analysis, structure, brand);

  return { analysis, structure, spec };
}
