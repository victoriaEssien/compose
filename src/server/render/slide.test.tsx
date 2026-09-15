import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { defaultBrandKit } from "@/types/brand";
import type { SlideSpec, TemplateKind } from "@/types/slide";
import { formatSizes } from "@/templates";
import { slideElement, slidePng } from "./slide";

const brand = {
  ...defaultBrandKit,
  name: "The Codebreaker.exe",
  username: "@codebreaker",
  fonts: { primary: "Space Grotesk", secondary: "Inter" } as const,
  colors: { background: "#0B0B0F", text: "#F5F5F7", accent: "#22D3EE", muted: "#8A8A96" },
  style: { radius: 16, card: "outlined", illustration: "line", codeBlock: "terminal" } as const,
};

const fixtures: Record<TemplateKind, SlideSpec> = {
  cover: {
    template: "cover",
    headline: "You probably don't need Redis yet",
    subheadline: "The 400ms query was a missing index, not a caching problem.",
    visual: "database_icon",
  },
  text: {
    template: "text",
    heading: "Read the query plan first",
    body: "EXPLAIN showed a sequential scan over two million rows. The database was doing exactly what it was asked to do, just slowly.",
    visual: null,
  },
  numbered_list: {
    template: "numbered_list",
    heading: "Three things that helped",
    items: [
      { title: "Measure before you cache", body: "Profile the query, do not guess at it." },
      { title: "Index the filter column", body: "One index took 400ms down to 2ms." },
      { title: "Keep the infra boring", body: null },
    ],
    visual: null,
  },
  code: {
    template: "code",
    heading: "One index, no Redis",
    language: "sql",
    code: "create index concurrently\n  on post (user_id);\n\nanalyze post;",
    explanation: "Concurrently, so the table keeps serving reads while it builds.",
    visual: null,
  },
  comparison: {
    template: "comparison",
    heading: "Before and after",
    left: { label: "Before", body: "Sequential scan over 2M rows, roughly 400ms per request." },
    right: { label: "After", body: "Index scan, roughly 2ms per request." },
    visual: null,
  },
  quote: {
    template: "quote",
    quote: "Premature optimisation is the root of all evil.",
    attribution: "Donald Knuth",
    visual: null,
  },
  screenshot: {
    template: "screenshot",
    heading: "The query plan",
    assetId: null,
    caption: "An index scan where there used to be a sequential scan.",
    visual: null,
  },
  project: {
    template: "project",
    name: "Tracer",
    description: "An open-source finder for your shell history, built in a weekend.",
    assetId: null,
    url: "https://example.com/tracer",
    visual: null,
  },
  final: {
    template: "final",
    heading: "Reach for the index first",
    body: "Caching cannot fix what the database is doing slowly on purpose.",
    cta: "Follow for more backend notes",
    visual: null,
  },
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
