import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { defaultBrandKit } from "@/types/brand";
import type { TemplateKind } from "@/types/slide";
import { formatSizes } from "@/templates";
import { sampleSlides as fixtures } from "@/templates/fixtures";
import { slideElement, slidePng } from "./slide";

const brand = {
  ...defaultBrandKit,
  name: "The Codebreaker.exe",
  username: "@codebreaker",
  fonts: { primary: "Space Grotesk", secondary: "Inter" } as const,
  colors: { background: "#0B0B0F", text: "#F5F5F7", accent: "#22D3EE", muted: "#8A8A96" },
  style: { radius: 16, card: "outlined", illustration: "line", codeBlock: "terminal" } as const,
};

/** PNG dimensions live in the IHDR chunk, right after the 8-byte signature. */
function pngSize(bytes: Buffer) {
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

const kinds = Object.keys(fixtures) as TemplateKind[];

describe("slidePng", () => {
  it.each(kinds)("draws the %s template at carousel size", { timeout: 120_000 }, async (kind) => {
    const response = await slidePng(
      { content: fixtures[kind], designConfig: null, index: 2 },
      brand,
      "carousel",
      9,
    );
    const bytes = Buffer.from(await response.arrayBuffer());

    expect(bytes.subarray(1, 4).toString()).toBe("PNG");
    expect(pngSize(bytes)).toEqual(formatSizes.carousel);
  });

  it("draws the square format at square size", { timeout: 120_000 }, async () => {
    const response = await slidePng(
      { content: fixtures.cover, designConfig: null, index: 0 },
      brand,
      "square",
      1,
    );
    const bytes = Buffer.from(await response.arrayBuffer());

    expect(pngSize(bytes)).toEqual(formatSizes.square);
  });
});

describe("slideElement", () => {
  it.each(kinds)("lays the %s template out the same way every time", async (kind) => {
    const element = await slideElement(
      { content: fixtures[kind], designConfig: null, index: 2 },
      brand,
      "carousel",
      9,
    );

    expect(renderToStaticMarkup(element)).toMatchSnapshot();
  });

  it("applies per-slide design overrides on top of the Brand Kit", async () => {
    const element = await slideElement(
      {
        content: fixtures.cover,
        designConfig: { backgroundColor: "#FFFFFF", textColor: "#111111", align: "center" },
        index: 0,
      },
      brand,
      "carousel",
      1,
    );
    const html = renderToStaticMarkup(element);

    expect(html).toContain("background-color:#FFFFFF");
    expect(html).toContain("text-align:center");
  });
});
