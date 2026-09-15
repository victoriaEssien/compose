import { maxListItems, slideTextLimits as limit } from "@/types/slide";
import type { SlideSpec, TemplateKind } from "@/types/slide";

/** The words a slide carries, independent of the template holding them. */
export type Gist = { primary: string; secondary: string | null; visual: string | null };

function clip(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

export function slideGist(slide: SlideSpec): Gist {
  const visual = slide.visual;

  switch (slide.template) {
    case "cover":
      return { primary: slide.headline, secondary: slide.subheadline, visual };
    case "text":
      return { primary: slide.heading, secondary: slide.body, visual };
    case "numbered_list":
      return {
        primary: slide.heading ?? slide.items[0].title,
        secondary: slide.items.map((item) => item.title).join(". "),
        visual,
      };
    case "code":
      return { primary: slide.heading ?? slide.language, secondary: slide.explanation, visual };
    case "comparison":
      return {
        primary: slide.heading ?? `${slide.left.label} vs ${slide.right.label}`,
        secondary: `${slide.left.body} ${slide.right.body}`,
        visual,
      };
    case "quote":
      return { primary: slide.quote, secondary: slide.attribution, visual };
    case "screenshot":
      return { primary: slide.heading ?? "Screenshot", secondary: slide.caption, visual };
    case "project":
      return { primary: slide.name, secondary: slide.description, visual };
    case "final":
      return { primary: slide.heading, secondary: slide.body ?? slide.cta, visual };
  }
}

/**
 * Carries a slide's words into another template. Fields the source cannot supply
 * get a placeholder rather than an empty string, which the schema rejects.
 */
export function remapSlide(slide: SlideSpec, template: TemplateKind): SlideSpec {
  if (slide.template === template) return slide;

  const { primary, secondary, visual } = slideGist(slide);
  const body = secondary ?? primary;

  switch (template) {
    case "cover":
      return {
        template,
        headline: clip(primary, limit.headline),
        subheadline: secondary && clip(secondary, limit.subheadline),
        visual,
      };
    case "text":
      return {
        template,
        heading: clip(primary, limit.heading),
        body: clip(body, limit.body),
        visual,
      };
    case "numbered_list":
      return {
        template,
        heading: clip(primary, limit.heading),
        items: (secondary ?? primary)
          .split(/(?<=[.!?])\s+/)
          .filter((sentence) => sentence.trim().length > 0)
          .slice(0, maxListItems)
          .map((sentence) => ({ title: clip(sentence.trim(), limit.itemTitle), body: null }))
          .concat(Array.from({ length: 2 }, () => ({ title: "Add a point", body: null })))
          .slice(0, Math.max(2, maxListItems)),
        visual,
      };
    case "code":
      return {
        template,
        heading: clip(primary, limit.heading),
        language: slide.template === "code" ? slide.language : "text",
        code: slide.template === "code" ? slide.code : clip(body, limit.code),
        explanation: secondary && clip(secondary, limit.explanation),
        visual,
      };
    case "comparison":
      return {
        template,
        heading: clip(primary, limit.heading),
        left: { label: "Before", body: clip(body, limit.comparisonBody) },
        right: { label: "After", body: "Add the other side" },
        visual,
      };
    case "quote":
      return {
        template,
        quote: clip(primary, limit.quote),
        attribution: secondary && clip(secondary, limit.attribution),
        visual,
      };
    case "screenshot":
      return {
        template,
        heading: clip(primary, limit.heading),
        assetId: slide.template === "project" ? slide.assetId : null,
        caption: secondary && clip(secondary, limit.caption),
        visual,
      };
    case "project":
      return {
        template,
        name: clip(primary, limit.projectName),
        description: clip(body, limit.projectDescription),
        assetId: slide.template === "screenshot" ? slide.assetId : null,
        url: null,
        visual,
      };
    case "final":
      return {
        template,
        heading: clip(primary, limit.heading),
        body: secondary && clip(secondary, limit.finalBody),
        cta: slide.template === "final" ? slide.cta : "Follow for more",
        visual,
      };
  }
}
