import { describe, expect, it } from "vitest";

import { sampleSlides } from "@/templates/fixtures";
import { defaultBrandKit } from "@/types/brand";
import type { SlideSpec } from "@/types/slide";
import type { AiProvider, JsonRequest } from "./provider";
import { regenerateSlide } from "./regenerate";

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

const base = {
  slide: sampleSlides.text as SlideSpec,
  instruction: null,
  brand: defaultBrandKit,
  postTitle: "You probably don't need Redis yet",
  originalContent: "A 400ms query turned out to be a missing index on post.user_id.",
  otherSlides: [sampleSlides.cover, sampleSlides.final] as SlideSpec[],
};

const shorter = {
  template: "text",
  heading: "Read the plan first",
  body: "EXPLAIN showed a sequential scan over two million rows.",
  visual: null,
};

describe("regenerateSlide", () => {
  it("returns the rewritten slide", async () => {
    const { provider } = fakeProvider([shorter]);

    const result = await regenerateSlide({ ...base, action: "shorter" }, provider);

    expect(result).toMatchObject({ template: "text", heading: "Read the plan first" });
  });

  it("holds the template steady for a wording change", async () => {
    const { provider, calls } = fakeProvider([shorter]);

    await regenerateSlide({ ...base, action: "clearer" }, provider);

    expect(calls[0]?.user).toContain("Keep the text template");
    expect(JSON.stringify(calls[0]?.jsonSchema)).not.toContain("numbered_list");
  });

  it("opens up every template when asked to change the layout", async () => {
    const { provider, calls } = fakeProvider([{ value: sampleSlides.numbered_list }]);

    const result = await regenerateSlide({ ...base, action: "change_layout" }, provider);

    expect(calls[0]?.user).toContain("may move it onto a different template");
    expect(result.template).toBe("numbered_list");
  });

  it("tells the model what the neighbouring slides already say", async () => {
    const { provider, calls } = fakeProvider([shorter]);

    await regenerateSlide({ ...base, action: "rewrite" }, provider);

    expect(calls[0]?.user).toContain(sampleSlides.cover.headline);
    expect(calls[0]?.user).toContain(sampleSlides.final.heading);
  });

  it("passes a free-text instruction through", async () => {
    const { provider, calls } = fakeProvider([shorter]);

    await regenerateSlide(
      { ...base, action: "rewrite", instruction: "Make this slide less wordy." },
      provider,
    );

    expect(calls[0]?.user).toContain("Make this slide less wordy.");
  });

  it("rejects a rewrite that drifts to another template when it was told not to", async () => {
    const wrongTemplate = { ...sampleSlides.quote };
    const { provider } = fakeProvider([wrongTemplate, wrongTemplate]);

    await expect(regenerateSlide({ ...base, action: "shorter" }, provider)).rejects.toThrow(
      /^regenerate\.v1:/,
    );
  });
});
