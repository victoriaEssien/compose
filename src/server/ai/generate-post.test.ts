import { describe, expect, it } from "vitest";

import { defaultBrandKit } from "@/types/brand";
import type { GeneratePostInput } from "@/types/post";
import { generatePost } from "./generate-post";
import { planDesign } from "./planner";
import type { AiProvider, JsonRequest } from "./provider";
import type { ContentAnalysis, ContentStructure } from "./schemas";

const input: GeneratePostInput = {
  content:
    "I spent three hours debugging a slow endpoint. It turned out to be a missing index on post.user_id. Adding it took the query from 400ms to 2ms. I nearly added Redis instead.",
  context: null,
  postType: "auto",
  tone: null,
};

const analysis: ContentAnalysis = {
  topic: "Database indexes before caching",
  audience: "Backend developers on small projects",
  tone: "Direct and technical",
  postType: "things_i_learned",
  complexity: "intermediate",
  suggestedSlideCount: 4,
};

const structure: ContentStructure = {
  hook: "I nearly added Redis to fix a 400ms query",
  body: "The endpoint was slow because post.user_id had no index.",
  supportingPoints: [
    { title: "Measure first", detail: "The query plan showed a sequential scan over 2M rows." },
    { title: "Index, then cache", detail: "One index took the query from 400ms to 2ms." },
  ],
  conclusion: "Reach for an index before you reach for a cache.",
  cta: "Follow for more backend notes",
};

const spec = {
  postType: "things_i_learned",
  title: "You probably don't need Redis yet",
  slideCount: 3,
  slides: [
    {
      template: "cover",
      headline: "I nearly added Redis to fix a 400ms query",
      subheadline: "It was a missing index",
      visual: "database_icon",
    },
    {
      template: "text",
      heading: "Measure first",
      body: "The query plan showed a sequential scan over 2M rows.",
      visual: null,
    },
    {
      template: "final",
      heading: "That's it",
      body: "Reach for an index before you reach for a cache.",
      cta: "Follow for more backend notes",
      visual: null,
    },
  ],
};

function fakeProvider(responses: unknown[]) {
  const queue = responses.map((value) =>
    typeof value === "string" ? value : JSON.stringify(value),
  );
  const calls: JsonRequest[] = [];

  const provider: AiProvider = {
    async generateJson(request) {
      calls.push(request);
      const next = queue.shift();
      if (next === undefined) throw new Error("the fake provider ran out of responses");
      return next;
    },
  };

  return { provider, calls };
}

describe("generatePost", () => {
  it("runs analyze, structure and plan in order and returns all three", async () => {
    const { provider, calls } = fakeProvider([analysis, structure, spec]);

    const result = await generatePost(input, defaultBrandKit, provider);

    expect(calls.map((call) => call.name)).toEqual(["analyze.v1", "structure.v1", "plan.v1"]);
    expect(result.analysis.postType).toBe("things_i_learned");
    expect(result.structure.hook).toBe(structure.hook);
    expect(result.spec.slides).toHaveLength(3);
  });

  it("lets an explicit post type override the model's guess", async () => {
    const { provider } = fakeProvider([analysis, structure, { ...spec, postType: "opinion" }]);

    const result = await generatePost({ ...input, postType: "opinion" }, defaultBrandKit, provider);

    expect(result.analysis.postType).toBe("opinion");
  });

  it("carries the brand voice into every prompt", async () => {
    const brand = { ...defaultBrandKit, voice: "Direct. Technical. No motivational fluff." };
    const { provider, calls } = fakeProvider([analysis, structure, spec]);

    await generatePost(input, brand, provider);

    for (const call of calls) expect(call.user).toContain("No motivational fluff");
  });

  it("fails when the model keeps inventing a template that is not registered", async () => {
    const rogue = { ...spec, slideCount: 1, slides: [{ ...spec.slides[0], template: "hero" }] };
    const { provider } = fakeProvider([analysis, structure, rogue, rogue]);

    await expect(generatePost(input, defaultBrandKit, provider)).rejects.toThrow(
      /^plan\.v1: .*template/,
    );
  });
});

describe("planDesign", () => {
  it("rejects a carousel that does not open on a cover slide", async () => {
    const badOrder = { ...spec, slides: [spec.slides[1], spec.slides[2]], slideCount: 2 };
    const { provider } = fakeProvider([badOrder, badOrder]);

    await expect(planDesign(provider, input, analysis, structure, defaultBrandKit)).rejects.toThrow(
      /first slide must use the cover template/,
    );
  });

  it("rejects a carousel that does not close on a final slide", async () => {
    const badOrder = { ...spec, slides: [spec.slides[0], spec.slides[1]], slideCount: 2 };
    const { provider } = fakeProvider([badOrder, badOrder]);

    await expect(planDesign(provider, input, analysis, structure, defaultBrandKit)).rejects.toThrow(
      /last slide must use the final template/,
    );
  });

  it("accepts a single cover slide, where there is no closing slide to require", async () => {
    const single = { ...spec, slides: [spec.slides[0]], slideCount: 1 };
    const { provider } = fakeProvider([single]);

    await expect(
      planDesign(provider, input, analysis, structure, defaultBrandKit),
    ).resolves.toMatchObject({ slideCount: 1 });
  });
});
