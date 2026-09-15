import { describe, expect, it } from "vitest";
import { ImageResponse } from "next/og";

import { decodePng, firstColumn } from "../../test/png";
import { satoriFonts } from "@/server/render/fonts";
import { defaultBrandKit } from "@/types/brand";
import { measureText } from "./measure";
import type { FontSpec } from "./measure";

// Every family, or Satori silently substitutes one it does have.
const allFonts = [
  ...satoriFonts({ ...defaultBrandKit, fonts: { primary: "Space Grotesk", secondary: "Inter" } }),
  ...satoriFonts({
    ...defaultBrandKit,
    fonts: { primary: "Playfair Display", secondary: "IBM Plex Sans" },
  }),
];

/**
 * Satori never reports a width, so a marker is placed immediately after the text
 * in a flex row. The marker's left edge is the advance width Satori laid out.
 */
async function satoriWidth(text: string, font: FontSpec, fontSize: number) {
  const response = new ImageResponse(
    <div
      style={{
        display: "flex",
        width: 2000,
        height: 200,
        alignItems: "center",
        backgroundColor: "#FFFFFF",
      }}
    >
      <div style={{ display: "flex" }}>
        <span
          style={{
            fontFamily: font.family,
            fontWeight: font.weight,
            fontSize,
            color: "#FFFFFF",
            whiteSpace: "pre",
          }}
        >
          {text}
        </span>
        <div style={{ display: "flex", width: 6, height: 120, backgroundColor: "#FF0000" }} />
      </div>
    </div>,
    {
      width: 2000,
      height: 200,
      fonts: allFonts,
    },
  );

  const pixels = decodePng(Buffer.from(await response.arrayBuffer()));
  const x = firstColumn(pixels, (r, g, b) => r > 200 && g < 80 && b < 80);

  if (x < 0) throw new Error("marker not found");
  return x;
}

const cases: { text: string; font: FontSpec; size: number }[] = [
  { text: "Stop Forgetting Database Migrations", font: { family: "Inter", weight: 700 }, size: 54 },
  { text: "iiiiiiiiiiiiiiiiiiii", font: { family: "Inter", weight: 400 }, size: 32 },
  { text: "WWWWWWWWWWWWWWWWWWWW", font: { family: "Inter", weight: 400 }, size: 32 },
  {
    text: "learning isn't always linear.",
    font: { family: "Space Grotesk", weight: 700 },
    size: 76,
  },
  { text: "const a = 1;", font: { family: "JetBrains Mono", weight: 400 }, size: 26 },
  { text: "Café résumé naïve — “quoted”", font: { family: "Inter", weight: 400 }, size: 32 },
  {
    text: "The quick brown fox jumps",
    font: { family: "Playfair Display", weight: 400 },
    size: 40,
  },
  { text: "AVWAToYaVoWe", font: { family: "IBM Plex Sans", weight: 700 }, size: 48 },
];

describe("measureText against satori", () => {
  it.each(cases)(
    "predicts the width of $font.family $weight at $size",
    { timeout: 120_000 },
    async ({ text, font, size }) => {
      const actual = await satoriWidth(text, font, size);
      const error = (measureText(text, font, size) - actual) / actual;

      expect(Math.abs(error)).toBeLessThan(0.01);
    },
  );
});
