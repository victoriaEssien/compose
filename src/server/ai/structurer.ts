/** Content Structurer (spec section 17). */
import "server-only";
import type { BrandKit } from "@/types/brand";
import type { GeneratePostInput } from "@/types/post";
import { structurePrompt } from "./prompts/structure.v1";
import type { AiProvider } from "./provider";
import { contentStructureSchema } from "./schemas";
import type { ContentAnalysis, ContentStructure } from "./schemas";
import { generateStructured } from "./structured";

export async function structureContent(
  provider: AiProvider,
  input: GeneratePostInput,
  analysis: ContentAnalysis,
  brand: BrandKit,
): Promise<ContentStructure> {
  const { system, user } = structurePrompt.build(input, analysis, brand);

  return generateStructured(provider, {
    name: structurePrompt.version,
    system,
    user,
    schema: contentStructureSchema,
  });
}
