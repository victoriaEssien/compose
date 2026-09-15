/**
 * Text measurement for the templates (spec section 9). Character counts do not
 * predict fit: Inter's i is 0.24em and its W is 0.99em, so glyphs get measured.
 */
import { fontMetrics, metricsCharset } from "./font-metrics";
import type { MetricsWeight } from "./font-metrics";

export type FontSpec = { family: string; weight: MetricsWeight };

const index = new Map([...metricsCharset].map((char, at) => [char, at]));

function metricsFor(font: FontSpec) {
  const family = fontMetrics[font.family] ?? fontMetrics.Inter;
  return family[font.weight] ?? family[400];
}

/** Width of one run of text in px, with no wrapping. */
export function measureText(text: string, font: FontSpec, fontSize: number) {
  const { widths, fallback } = metricsFor(font);

  let em = 0;
  for (const char of text) {
    const at = index.get(char);
    em += at === undefined ? fallback : widths[at];
  }

  return em * fontSize;
}

/**
 * Greedy word wrap, matching how Satori breaks a paragraph. A single word wider
 * than the box is split across lines rather than counted as one.
 */
export function countLines(text: string, font: FontSpec, fontSize: number, maxWidth: number) {
  // Nothing to draw takes no height, but a blank line inside a paragraph does.
  if (text.length === 0) return 0;
  if (maxWidth <= 0) return 1;

  let lines = 0;

  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines += 1;
      continue;
    }

    let width = 0;
    lines += 1;

    for (const word of words) {
      const wordWidth = measureText(word, font, fontSize);
      const spaced = width === 0 ? wordWidth : width + measureText(" ", font, fontSize) + wordWidth;

      if (spaced <= maxWidth) {
        width = spaced;
        continue;
      }

      if (width > 0) lines += 1;

      // A word too wide for an empty line wraps inside itself.
      if (wordWidth > maxWidth) {
        const rows = Math.ceil(wordWidth / maxWidth);
        lines += rows - 1;
        width = wordWidth - maxWidth * (rows - 1);
        continue;
      }

      width = wordWidth;
    }
  }

  return lines;
}

/** Height of one wrapped block in px. */
export function measureBlockHeight(
  text: string,
  font: FontSpec,
  fontSize: number,
  maxWidth: number,
  lineHeight: number,
) {
  return countLines(text, font, fontSize, maxWidth) * fontSize * lineHeight;
}

export type TextBlock = {
  text: string;
  font: FontSpec;
  /** The size the brand asks for. Fitting only ever shrinks it. */
  size: number;
  lineHeight: number;
  /** Readability floor. Overflowing slightly beats being unreadable. */
  min: number;
  /** Width taken by something beside the text, like a list number gutter. */
  inset?: number;
};

export type FitBox = {
  width: number;
  height: number;
  /** Height the block does not control: gaps, padding, images, rules. */
  fixed?: number;
};

const steps = 24;

/**
 * Scales a whole stack of text down together until it fits its box, so the type
 * hierarchy survives. One knob, rather than each block shrinking on its own.
 */
export function fitStack(blocks: TextBlock[], box: FitBox): number[] {
  const sizesAt = (scale: number) =>
    blocks.map((block) => Math.max(block.min, Math.floor(block.size * scale)));

  const heightAt = (sizes: number[]) =>
    blocks.reduce(
      (total, block, at) =>
        total +
        measureBlockHeight(
          block.text,
          block.font,
          sizes[at],
          box.width - (block.inset ?? 0),
          block.lineHeight,
        ),
      box.fixed ?? 0,
    );

  if (heightAt(sizesAt(1)) <= box.height) return sizesAt(1);

  // Height rises with scale, so the largest scale that fits is a binary search.
  let low = 0;
  let high = 1;

  for (let step = 0; step < steps; step++) {
    const mid = (low + high) / 2;
    if (heightAt(sizesAt(mid)) <= box.height) low = mid;
    else high = mid;
  }

  return sizesAt(low);
}
