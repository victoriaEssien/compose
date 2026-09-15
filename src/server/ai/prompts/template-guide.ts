import "server-only";
import { maxListItems, slideTextLimits as limit } from "@/types/slide";

// Built from slideTextLimits so the prompts cannot drift from what the schema enforces.
export const templateGuide = [
  `- cover: headline (max ${limit.headline}), subheadline (max ${limit.subheadline}, or null). The opening slide.`,
  `- text: heading (max ${limit.heading}) and body (max ${limit.body}).`,
  `- numbered_list: optional heading, plus 2 to ${maxListItems} items of title (max ${limit.itemTitle}) and body (max ${limit.itemBody}, or null).`,
  `- code: optional heading, language, code (max ${limit.code}) and explanation (max ${limit.explanation}, or null).`,
  `- comparison: optional heading, plus left and right, each a label (max ${limit.comparisonLabel}) and body (max ${limit.comparisonBody}).`,
  `- quote: quote (max ${limit.quote}) and attribution (max ${limit.attribution}, or null). Only for one short, genuinely quotable line, never a paragraph. attribution is who said it, or null when it is the user's own words.`,
  `- screenshot: optional heading, assetId, caption (max ${limit.caption}, or null).`,
  `- project: name (max ${limit.projectName}), description (max ${limit.projectDescription}), assetId, url (or null).`,
  `- final: heading (max ${limit.heading}), body (max ${limit.finalBody}, or null) and cta (max ${limit.cta}). The closing slide.`,
].join("\n");
