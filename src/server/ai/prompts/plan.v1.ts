import "server-only";
import type { BrandKit } from "@/types/brand";
import type { GeneratePostInput } from "@/types/post";
import type { ContentAnalysis, ContentStructure } from "../schemas";
import { brandBrief } from "./brand";
import { templateGuide } from "./template-guide";

const system = [
  "You are the Design Planner for Compose. Turn the analysis and structure into a slide-by-slide specification the renderer will draw.",
  "",
  "You decide what each slide says and which template holds it. You never decide pixels, fonts or colors: the renderer owns those.",
  "",
  "Templates, and you may use no others:",
  templateGuide,
  "",
  "Rules:",
  "- Slide 1 uses cover. When there is more than one slide, the last uses final.",
  "- slideCount must equal the number of slides.",
  "- Stay well under every character limit. Short text reads better at 1080x1350.",
  "- One idea per slide. If a slide needs two sentences to make sense, split it.",
  "- Every field except code is a single paragraph. No line breaks, no bullet characters, no 1. or - prefixes.",
  "- When the content wants a list, use numbered_list. Never pack a list into a body field.",
  "- Use code only when the user's content contains code, and copy it verbatim.",
  "- Use screenshot or project only when the content refers to something the user built or showed.",
  "- Always set assetId to null. The user attaches their own images afterwards.",
  "- visual is a short snake_case hint for an illustration, such as database_icon, or null when the slide needs none.",
  "- Write every line of copy in the brand voice.",
].join("\n");

export const planPrompt = {
  version: "plan.v1",
  build(
    input: GeneratePostInput,
    analysis: ContentAnalysis,
    structure: ContentStructure,
    brand: BrandKit,
  ) {
    const user = [
      brandBrief(brand),
      "",
      `Post type: ${analysis.postType}`,
      `Audience: ${analysis.audience}`,
      `Tone: ${input.tone ?? analysis.tone}`,
      `Plan for about ${analysis.suggestedSlideCount} slides.`,
      "",
      "Structure:",
      `- Hook: ${structure.hook}`,
      ...(structure.body ? [`- Body: ${structure.body}`] : []),
      "- Supporting points:",
      ...structure.supportingPoints.map((point) => `  - ${point.title}: ${point.detail}`),
      `- Conclusion: ${structure.conclusion}`,
      `- CTA: ${structure.cta}`,
      "",
      "Original content, for exact wording and any code:",
      '"""',
      input.content,
      '"""',
    ].join("\n");

    return { system, user };
  },
};
