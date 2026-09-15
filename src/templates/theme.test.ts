import { describe, expect, it } from "vitest";

import { defaultBrandKit } from "@/types/brand";
import { fitCodeFontSize, formatSizes, slideTheme } from "./theme";

const theme = slideTheme(defaultBrandKit, "carousel");

/** Mono glyphs are 0.6em wide, and the block is inset 32px on each side. */
function renderedWidth(chars: number, fontSize: number) {
  return chars * fontSize * 0.6 + 64;
}

describe("fitCodeFontSize", () => {
  it("leaves short lines at the brand size", () => {
    expect(fitCodeFontSize(20, theme)).toBe(theme.type.code);
  });

  it("shrinks a line that would otherwise run off the slide", () => {
    const longest = 58;

    const fontSize = fitCodeFontSize(longest, theme);

    expect(fontSize).toBeLessThan(theme.type.code);
    expect(renderedWidth(longest, fontSize)).toBeLessThanOrEqual(formatSizes.carousel.width);
  });

  it("keeps every plausible line inside the slide", () => {
    for (let longest = 1; longest <= 120; longest++) {
      const width = renderedWidth(longest, fitCodeFontSize(longest, theme));

      // Below the floor the text stays readable instead, which is the better trade.
      if (fitCodeFontSize(longest, theme) > 14) {
        expect(width, `${longest} characters overflowed`).toBeLessThanOrEqual(
          formatSizes.carousel.width,
        );
      }
    }
  });

  it("does not shrink past the readable floor", () => {
    expect(fitCodeFontSize(500, theme)).toBe(14);
  });

  it("handles an empty block", () => {
    expect(fitCodeFontSize(0, theme)).toBe(theme.type.code);
  });
});
