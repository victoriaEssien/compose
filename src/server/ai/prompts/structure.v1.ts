import "server-only";
import type { BrandKit } from "@/types/brand";
import type { GeneratePostInput } from "@/types/post";
import { maxSupportingPoints, structureLimits as limit } from "../schemas";
import type { ContentAnalysis } from "../schemas";
import { brandBrief } from "./brand";

// Built from structureLimits so the prompt cannot drift from what the schema enforces.
const fields = [
  `- hook: the opening line, max ${limit.hook} characters. Concrete and specific to this content.`,
  `- body: two or three sentences explaining the core of the point, max ${limit.body} characters. Null when the supporting points already say everything.`,
  `- supportingPoints: 1 to ${maxSupportingPoints} points, each a title (max ${limit.pointTitle}) and a detail (max ${limit.pointDetail}). One idea each, able to stand alone on a slide.`,
  `- conclusion: what the reader should take away, max ${limit.conclusion} characters. Not a summary.`,
  `- cta: what to do next, max ${limit.cta} characters. This is a hard limit, so keep it to one short sentence.`,
].join("\n");

const system = [
  "You are the Content Structurer for Compose. Turn the user's raw notes into the narrative skeleton of a carousel.",
  "",
  "Fields, and every limit is enforced:",
  fields,
  "",
  "Rules:",
  "- Use only what is in the user's content. Never invent numbers, names, benchmarks or results.",
  "- No clickbait, no rhetorical questions the user did not ask, no 'Here is why' openers.",
  "- The CTA should sound like the user talking, not like a marketer.",
  "- Do not repeat the same sentence across body, conclusion and the points.",
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
