import "server-only";
import type { BrandKit } from "@/types/brand";
import type { GeneratePostInput } from "@/types/post";
import type { ContentAnalysis } from "../schemas";
import { brandBrief } from "./brand";

const system = [
  "You are the Content Structurer for Compose. Turn the user's raw notes into the narrative skeleton of a carousel.",
  "",
  "Rules:",
  "- Use only what is in the user's content. Never invent numbers, names, benchmarks or results.",
  "- The hook is the first thing anyone reads. Make it concrete and specific to this content.",
  "- No clickbait, no rhetorical questions the user did not ask, no 'Here is why' openers.",
  "- Each supporting point carries one idea and can stand alone on a slide.",
  "- The conclusion is what the reader should take away, not a summary of the post.",
  "- The CTA should sound like the user talking, not like a marketer.",
  "- Match the brand voice exactly.",
].join("\n");

export const structurePrompt = {
  version: "structure.v1",
  build(input: GeneratePostInput, analysis: ContentAnalysis, brand: BrandKit) {
    const user = [
      brandBrief(brand),
      "",
      "Analysis:",
      `- Topic: ${analysis.topic}`,
      `- Audience: ${analysis.audience}`,
      `- Tone: ${analysis.tone}`,
      `- Post type: ${analysis.postType}`,
      `- Complexity: ${analysis.complexity}`,
      `- Suggested slides: ${analysis.suggestedSlideCount}`,
      "",
      `Aim for about ${analysis.suggestedSlideCount - 2} supporting points, so the cover and final slides have room.`,
      "",
      "Content:",
      '"""',
      input.content,
      '"""',
    ].join("\n");

    return { system, user };
  },
};
