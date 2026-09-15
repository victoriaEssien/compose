/**
 * A template's text as blocks the measurer understands. Every role mirrors what
 * the matching primitive draws; change one without the other and the fit lies.
 */
import { resolveIcon } from "./icons";
import { fitStack } from "./measure";
import type { TextBlock } from "./measure";
import type { TemplateKind } from "@/types/slide";
import type { SlideTheme } from "./theme";
import type { SlideRenderContext } from "./types";

export type TextRole = "display" | "heading" | "body" | "item" | "caption";

const lineHeights: Record<TextRole, number> = {
  display: 1.08,
  heading: 1.08,
  body: 1.45,
  item: 1.4,
  caption: 1.4,
};

/** Below these a slide is unreadable, so overflowing slightly is the better trade. */
const floors: Record<TextRole, number> = {
  display: 36,
  heading: 30,
  body: 20,
  item: 19,
  caption: 17,
};

export function textBlock(
  theme: SlideTheme,
  role: TextRole,
  text: string | null,
  extra: Partial<TextBlock> = {},
): TextBlock {
  const isHeading = role === "display" || role === "heading";

  return {
    text: text ?? "",
    font: {
      family: isHeading ? theme.fonts.primary : theme.fonts.secondary,
      weight: isHeading ? 700 : 400,
    },
    size: theme.type[role],
    lineHeight: lineHeights[role],
    min: floors[role],
    ...extra,
  };
}

/** Icon or illustration, plus the gap Shell puts under it. */
export function markHeight<K extends TemplateKind>(context: SlideRenderContext<K>) {
  if (context.illustrationUrl) return 144 + 40;
  return resolveIcon(context.slide.visual) ? 72 + 40 : 0;
}

/**
 * `fixed` is every pixel the blocks do not control: stack gaps, images, surface
 * padding, the eyebrow and CTA rows.
 */
export function fitSlide<K extends TemplateKind>(
  context: SlideRenderContext<K>,
  blocks: TextBlock[],
  fixed = 0,
) {
  return fitStack(blocks, {
    width: context.theme.content.width,
    height: context.theme.content.height - markHeight(context),
    fixed,
  });
}

/**
 * Side by side columns are as tall as the taller one, not their sum, so each is
 * fitted alone and the smaller result wins to keep them symmetrical.
 */
export function fitColumns<K extends TemplateKind>(
  context: SlideRenderContext<K>,
  columns: TextBlock[][],
  width: number,
  fixed = 0,
) {
  const height = context.theme.content.height - markHeight(context) - fixed;

  return columns
    .map((blocks) => fitStack(blocks, { width, height }))
    .reduce((best, sizes) => best.map((size, at) => Math.min(size, sizes[at])));
}
