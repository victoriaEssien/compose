import { describe, expect, it } from "vitest";

import { maxSlides, postSpecSchema, postTypeRequestSchema, postTypeSchema } from "./post";
import { slideSpecSchema, slideTextLimits, templateKinds } from "./slide";
import type { SlideSpec, SlideSpecOf, TemplateKind } from "./slide";

const coverSlide: SlideSpec = {
  template: "cover",
  headline: "You probably don't need Redis yet",
  subheadline: "Start with the database you already have",
  visual: "database_icon",
};

const textSlide: SlideSpec = {
  template: "text",
  heading: "Start with your database",
  body: "Postgres will happily serve reads at the scale most side projects reach.",
  visual: null,
};

/** One fixture per registered template, so the union is exercised end to end. */
const slideFixtures: { [K in TemplateKind]: SlideSpecOf<K> } = {
  cover: coverSlide,
  text: textSlide,
  numbered_list: {
    template: "numbered_list",
    heading: "Three things that helped",
    items: [
      { title: "Measure first", body: "Profile before you cache." },
      { title: "Cache last", body: null },
    ],
    visual: null,
  },
  code: {
    template: "code",
    heading: "One index, no Redis",
    language: "sql",
    code: "create index concurrently on post (user_id);",
    explanation: "This turned a 400ms scan into a 2ms lookup.",
    visual: null,
  },
  comparison: {
    template: "comparison",
    heading: "Before and after",
    left: { label: "Before", body: "Sequential scan over 2M rows." },
    right: { label: "After", body: "Index scan, 2ms." },
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
    caption: "Index scan instead of a sequential scan.",
    visual: null,
  },
  project: {
    template: "project",
    name: "Tracer",
    description: "An open-source finder for your shell history.",
    assetId: null,
    url: "https://example.com/tracer",
    visual: null,
  },
  final: {
    template: "final",
    heading: "That's it",
    body: "Reach for an index before you reach for a cache.",
    cta: "Follow for more backend notes",
    visual: null,
  },
};

/** Drops a key, so the schema sees it as absent rather than as undefined. */
function omit(value: object, key: string): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...value };
  delete copy[key];
  return copy;
}

function postSpec(slides: SlideSpec[]) {
  return {
    postType: "educational" as const,
    title: "You probably don't need Redis yet",
    slideCount: slides.length,
    slides,
  };
}

describe("postTypeSchema", () => {
  it("rejects the auto placeholder, which is an input choice only", () => {
    expect(postTypeSchema.safeParse("auto").success).toBe(false);
    expect(postTypeRequestSchema.safeParse("auto").success).toBe(true);
  });
});

describe("slideSpecSchema", () => {
  it.each(templateKinds)("accepts a well-formed %s slide", (kind) => {
    expect(slideSpecSchema.safeParse(slideFixtures[kind]).success).toBe(true);
  });

  it("covers every registered template with a fixture", () => {
    expect(Object.keys(slideFixtures).sort()).toEqual([...templateKinds].sort());
  });

  it("rejects a template that is not registered", () => {
    const result = slideSpecSchema.safeParse({ ...coverSlide, template: "hero" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["template"]);
  });

  it("requires nullable fields to be present rather than omitted", () => {
    expect(slideSpecSchema.safeParse(omit(coverSlide, "subheadline")).success).toBe(false);
  });
});

describe("postSpecSchema", () => {
  it("accepts a valid carousel", () => {
    const result = postSpecSchema.safeParse(postSpec([coverSlide, textSlide]));

    expect(result.success).toBe(true);
    expect(result.data?.slides).toHaveLength(2);
  });

  it("accepts a single-slide post", () => {
    expect(postSpecSchema.safeParse(postSpec([coverSlide])).success).toBe(true);
  });

  it("rejects a missing required field", () => {
    const result = postSpecSchema.safeParse(omit(postSpec([coverSlide]), "title"));

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["title"]);
  });

  it("rejects text that would overflow the layout", () => {
    const headline = "a".repeat(slideTextLimits.headline + 1);

    const result = postSpecSchema.safeParse(postSpec([{ ...coverSlide, headline }]));

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["slides", 0, "headline"]);
  });

  it("rejects copy that smuggles layout in as line breaks", () => {
    const body = "Measure first.\nThen cache.";

    const result = postSpecSchema.safeParse(postSpec([{ ...textSlide, body }]));

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/no line breaks/);
  });

  it("still allows line breaks inside a code slide", () => {
    const code = "create index concurrently on post (user_id);\nanalyze post;";

    const result = postSpecSchema.safeParse(postSpec([{ ...slideFixtures.code, code }]));

    expect(result.success).toBe(true);
  });

  it("rejects a slideCount that disagrees with the slides", () => {
    const result = postSpecSchema.safeParse({
      ...postSpec([coverSlide, textSlide]),
      slideCount: 5,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["slideCount"]);
  });

  it("rejects an empty post", () => {
    expect(postSpecSchema.safeParse(postSpec([])).success).toBe(false);
  });

  it("rejects more slides than a carousel can hold", () => {
    const slides = Array.from({ length: maxSlides + 1 }, () => textSlide);

    expect(postSpecSchema.safeParse(postSpec(slides)).success).toBe(false);
  });
});
