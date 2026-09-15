import { describe, expect, it } from "vitest";

import { slideSpecSchema, slideTextLimits, templateKinds } from "@/types/slide";
import { sampleSlides } from "./fixtures";
import { remapSlide } from "./remap";

const pairs = templateKinds.flatMap((from) => templateKinds.map((to) => [from, to] as const));

describe("remapSlide", () => {
  it.each(pairs)("turns a %s slide into a valid %s slide", (from, to) => {
    const result = remapSlide(sampleSlides[from], to);
    const parsed = slideSpecSchema.safeParse(result);

    expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
    expect(result.template).toBe(to);
  });

  it("returns the same slide when the template does not change", () => {
    expect(remapSlide(sampleSlides.cover, "cover")).toBe(sampleSlides.cover);
  });

  it("carries the headline across as the new heading", () => {
    const result = remapSlide(sampleSlides.cover, "text");

    expect(result).toMatchObject({ template: "text", heading: sampleSlides.cover.headline });
  });

  it("keeps the code when a code slide is only reheaded", () => {
    const result = remapSlide(sampleSlides.code, "code");

    expect(result).toBe(sampleSlides.code);
  });

  it("keeps the snippet when moving code onto another template, as the explanation", () => {
    const result = remapSlide(sampleSlides.code, "text");

    expect(result).toMatchObject({ template: "text", heading: "One index, no Redis" });
  });

  it("clips text that will not fit the target field", () => {
    const long = "word ".repeat(80).trim();
    const result = remapSlide({ ...sampleSlides.quote, quote: long }, "cover");

    expect(result.template).toBe("cover");
    if (result.template !== "cover") return;
    expect(result.headline.length).toBeLessThanOrEqual(slideTextLimits.headline);
    expect(result.headline.endsWith("…")).toBe(true);
  });

  it("moves an image across between the two image templates", () => {
    const assetId = "0b6a0a3e-9d0f-4f0a-9d1a-6f2b4d2c8f11";
    const result = remapSlide({ ...sampleSlides.screenshot, assetId }, "project");

    expect(result).toMatchObject({ template: "project", assetId });
  });

  it("gives the list at least two items even from a single sentence", () => {
    const result = remapSlide({ ...sampleSlides.quote, attribution: null }, "numbered_list");

    expect(result.template).toBe("numbered_list");
    if (result.template !== "numbered_list") return;
    expect(result.items.length).toBeGreaterThanOrEqual(2);
  });
});
