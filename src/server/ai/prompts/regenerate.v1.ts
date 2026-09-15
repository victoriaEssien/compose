import "server-only";
import type { BrandKit } from "@/types/brand";
import type { RegenerateAction, SlideSpec } from "@/types/slide";
import { brandBrief } from "./brand";
import { templateGuide } from "./template-guide";

const asks: Record<RegenerateAction, string> = {
  rewrite: "Rewrite this slide. Same point, better words.",
  shorter: "Say the same thing in noticeably fewer words.",
  clearer: "Make it clearer. Cut anything that needs a second read.",
  funnier: "Add dry humour, but only where it lands. Do not force a joke.",
  more_technical: "Go a level deeper. Name the actual mechanism instead of gesturing at it.",
  change_layout: "Move this content onto a template that suits it better.",
  another_design: "Same point, a different template and a different angle on the wording.",
};

const system = [
  "You are rewriting a single slide of an Instagram carousel for Compose.",
  "",
  "Rules:",
  "- Change only this slide. The rest of the post stays exactly as it is.",
  "- Do not repeat what the neighbouring slides already say, and do not introduce a new topic.",
  "- Use only facts from the original post content. Never invent numbers, names or results.",
  "- Every field except code is a single paragraph. No line breaks, no bullet characters.",
  "- Stay well under every character limit.",
  "- Leave assetId as it is.",
  "- Write in the brand voice.",
  "- When you move a slide to another template, pick one the content actually fits. Never force a paragraph into quote.",
  "",
  "Templates, and you may use no others:",
  templateGuide,
].join("\n");

export const regeneratePrompt = {
  version: "regenerate.v1",
  build(args: {
    slide: SlideSpec;
    action: RegenerateAction;
    instruction: string | null;
    brand: BrandKit;
    postTitle: string;
    originalContent: string;
    neighbours: string[];
    keepTemplate: boolean;
  }) {
    const user = [
      brandBrief(args.brand),
      "",
      `Post: ${args.postTitle}`,
      "",
      "The other slides say:",
      ...args.neighbours.map((text) => `- ${text}`),
      "",
      "The slide to change:",
      JSON.stringify(args.slide, null, 2),
      "",
      args.keepTemplate
        ? `Keep the ${args.slide.template} template.`
        : "You may move it onto a different template.",
      "",
      `What to do: ${asks[args.action]}`,
      ...(args.instruction ? ["", `Also, from the user: ${args.instruction}`] : []),
      "",
      "Original post content, for facts and exact wording:",
      '"""',
      args.originalContent,
      '"""',
    ].join("\n");

    return { system, user };
  },
};
