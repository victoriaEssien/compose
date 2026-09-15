import type { BrandKit } from "@/types/brand";
import type { SlideDesignConfig } from "@/types/slide";

export const slideFormats = ["carousel", "square"] as const;

export type SlideFormat = (typeof slideFormats)[number];

export const formatSizes: Record<SlideFormat, { width: number; height: number }> = {
  carousel: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
};

export type SlideTheme = ReturnType<typeof slideTheme>;

/** The avatar row Frame pins to the bottom, plus air so text never kisses it. */
const footerHeight = 44 + 48;

function withAlpha(hex: string, alpha: number) {
  const value = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${value}`;
}

/**
 * Resolves the Brand Kit and any per-slide overrides into the concrete values
 * the templates draw with. Templates never read the Brand Kit directly.
 */
export function slideTheme(
  brand: BrandKit,
  format: SlideFormat,
  overrides: SlideDesignConfig = {},
) {
  const background = overrides.backgroundColor ?? brand.colors.background;
  const text = overrides.textColor ?? brand.colors.text;
  const accent = overrides.accentColor ?? brand.colors.accent;
  const muted = brand.colors.muted;
  const scale = overrides.fontScale ?? 1;

  const size = (base: number) => Math.round(base * scale);

  const surfaces = {
    flat: { background: withAlpha(text, 0.06), border: "none" },
    outlined: { background: "transparent", border: `2px solid ${withAlpha(text, 0.18)}` },
    elevated: { background: withAlpha(text, 0.1), border: `1px solid ${withAlpha(text, 0.08)}` },
    glass: { background: withAlpha(text, 0.08), border: `1px solid ${withAlpha(text, 0.22)}` },
  } as const;

  const padding = 80;

  return {
    format,
    ...formatSizes[format],
    padding,
    /** What a template may fill: the frame less its padding and the footer row. */
    content: {
      width: formatSizes[format].width - padding * 2,
      height: formatSizes[format].height - padding * 2 - footerHeight,
    },
    colors: { background, text, accent, muted, faint: withAlpha(text, 0.45) },
    fonts: { primary: brand.fonts.primary, secondary: brand.fonts.secondary },
    radius: brand.style.radius,
    codeBlock: brand.style.codeBlock,
    surface: surfaces[brand.style.card],
    align: overrides.align ?? "left",
    type: {
      display: size(format === "carousel" ? 76 : 68),
      heading: size(54),
      body: size(32),
      item: size(30),
      code: size(26),
      caption: size(26),
      footer: size(24),
      eyebrow: size(22),
    },
  };
}

/** JetBrains Mono advances 0.6em per character, and every glyph is the same width. */
const monoAdvance = 0.6;

/** Padding inside the code surface, both sides. */
const codeInset = 64;

/**
 * Code must not wrap, so a long line shrinks the whole block to fit instead of
 * spilling off the slide. Floored so it stays readable at 1080 wide.
 */
export function fitCodeFontSize(longestLine: number, theme: SlideTheme) {
  if (longestLine <= 0) return theme.type.code;

  const available = theme.width - theme.padding * 2 - codeInset;
  const fitted = Math.floor(available / (longestLine * monoAdvance));

  return Math.max(14, Math.min(theme.type.code, fitted));
}
