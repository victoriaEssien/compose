/** Content Analyzer (spec section 17). */
import "server-only";
import type { BrandKit } from "@/types/brand";
import type { GeneratePostInput } from "@/types/post";
import { analyzePrompt } from "./prompts/analyze.v1";
import type { AiProvider } from "./provider";
import { contentAnalysisSchema } from "./schemas";
import type { ContentAnalysis } from "./schemas";
import { generateStructured } from "./structured";

export async function analyzeContent(
  provider: AiProvider,
  input: GeneratePostInput,
  brand: BrandKit,
): Promise<ContentAnalysis> {
  const { system, user } = analyzePrompt.build(input, brand);

  const analysis = await generateStructured(provider, {
    name: analyzePrompt.version,
    system,
    user,
    schema: contentAnalysisSchema,
  });

  // An explicit choice on the Create Post screen beats the model's guess.
  return input.postType === "auto" ? analysis : { ...analysis, postType: input.postType };
}
