import "server-only";
import { maxListItems, slideTextLimits as limit } from "@/types/slide";

// Built from slideTextLimits so the prompts cannot drift from the house style.
// These are targets: the renderer measures and shrinks, so a little over is safe
// and only well over is rejected.
export const templateGuide = [
  `- cover: headline (aim for ${limit.headline}), subheadline (aim for ${limit.subheadline}, or null). The opening slide.`,
  `- text: heading (aim for ${limit.heading}) and body (aim for ${limit.body}).`,
  `- numbered_list: optional heading, plus 2 to ${maxListItems} items of title (aim for ${limit.itemTitle}) and body (aim for ${limit.itemBody}, or null).`,
  `- code: optional heading, language, code (aim for ${limit.code}) and explanation (aim for ${limit.explanation}, or null). Keep every line of code under 55 characters so it fits the slide without shrinking.`,
  `- comparison: optional heading, plus left and right, each a label (aim for ${limit.comparisonLabel}) and body (aim for ${limit.comparisonBody}).`,
  `- quote: quote (aim for ${limit.quote}) and attribution (aim for ${limit.attribution}, or null). Only for one short, genuinely quotable line, never a paragraph. attribution is who said it, or null when it is the user's own words.`,
  `- screenshot: optional heading, assetId, caption (aim for ${limit.caption}, or null).`,
  `- project: name (aim for ${limit.projectName}), description (aim for ${limit.projectDescription}), assetId, url (or null).`,
  `- final: heading (aim for ${limit.heading}), body (aim for ${limit.finalBody}, or null) and cta (aim for ${limit.cta}). The closing slide.`,
].join("\n");
