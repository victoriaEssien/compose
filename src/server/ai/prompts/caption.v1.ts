import "server-only";
import type { BrandKit } from "@/types/brand";
import { brandBrief } from "./brand";

const system = [
  "You are writing the Instagram caption that goes with a finished carousel for Compose.",
  "",
  "Rules:",
  "- The slides carry the argument. The caption sets it up and adds the part that did not fit.",
  "- Never summarise the slides one by one, and never write 'swipe to see all N tips'.",
  "- Open with a line that works on its own, because Instagram truncates after roughly 125 characters.",
  "- Short paragraphs separated by a blank line. No bullet characters, no numbered lists.",
  "- Use only facts from the post. Never invent numbers, names, results or links.",
  "- Write in the brand voice.",
  "- No emoji unless the brand voice clearly calls for them.",
  "- Hashtags are lowercase, specific to the topic, and never generic reach bait like #instagood.",
  "- Give between 5 and 12 hashtags, each without the leading #.",
].join("\n");

export const captionPrompt = {
  version: "caption.v1",
  build(args: {
    brand: BrandKit;
    postTitle: string;
    originalContent: string;
    slides: string[];
    cta: string | null;
  }) {
    const user = [
      brandBrief(args.brand),
      "",
      `Post: ${args.postTitle}`,
      "",
      "The slides say, in order:",
      ...args.slides.map((text, at) => `${at + 1}. ${text}`),
      ...(args.cta ? ["", `The final slide's call to action: ${args.cta}`] : []),
      "",
      "What the user originally wrote, for facts and exact wording:",
      '"""',
      args.originalContent,
      '"""',
      "",
      "Write the caption and the hashtags.",
    ].join("\n");

    return { system, user };
  },
};
