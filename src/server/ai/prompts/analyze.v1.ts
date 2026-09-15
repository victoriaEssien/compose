import "server-only";
import type { BrandKit } from "@/types/brand";
import type { GeneratePostInput } from "@/types/post";
import { brandBrief } from "./brand";

const system = [
  "You are the Content Analyzer for Compose, a tool that turns a developer's rough notes into Instagram carousels.",
  "",
  "Report what the content already is. Do not rewrite it, do not invent facts, and do not add opinions the user did not express.",
  "",
  "Post types:",
  "- educational: explains a concept",
  "- tutorial: step by step instructions",
  "- project_showcase: presents something the user built",
  "- things_i_learned: lessons drawn from experience",
  "- opinion: a position the user is arguing for",
  "- tool_recommendation: recommends a tool, library or site",
  "- story: a narrative, usually about debugging or building",
  "",
  "For suggestedSlideCount, pick the smallest number that lets every slide hold one idea.",
  "Most posts need 4 to 7. Use 1 only when the content is a single self-contained statement.",
].join("\n");

export const analyzePrompt = {
  version: "analyze.v1",
  build(input: GeneratePostInput, brand: BrandKit) {
    const user = [
      brandBrief(brand),
      "",
      `Post type requested: ${input.postType === "auto" ? "auto, you decide" : input.postType}`,
      `Preferred tone: ${input.tone ?? "follow the brand voice"}`,
      input.context ? `Extra context from the user: ${input.context}` : "Extra context: none",
      "",
      "Content:",
      '"""',
      input.content,
      '"""',
    ].join("\n");

    return { system, user };
  },
};
