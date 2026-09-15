import { describe, expect, it } from "vitest";

import { sampleSlides } from "@/templates/fixtures";
import { defaultBrandKit } from "@/types/brand";
import { captionText } from "@/types/caption";
import type { SlideSpec } from "@/types/slide";
import { generateCaption } from "./caption";
import type { AiProvider, JsonRequest } from "./provider";

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
  brand: defaultBrandKit,
  postTitle: "You probably don't need Redis yet",
  originalContent: "A 400ms query turned out to be a missing index on post.user_id.",
  slides: [sampleSlides.cover, sampleSlides.code, sampleSlides.final] as SlideSpec[],
};

const written = {
  caption: "The 400ms query was never a caching problem.\n\nIt was a missing index.",
  hashtags: ["postgres", "backend", "webdev"],
};

describe("generateCaption", () => {
  it("returns the caption and hashtags", async () => {
    const { provider } = fakeProvider([written]);

    await expect(generateCaption(base, provider)).resolves.toEqual(written);
  });

  it("strips a leading # the model added anyway", async () => {
    const { provider } = fakeProvider([{ ...written, hashtags: ["#postgres", "##backend"] }]);
    const result = await generateCaption(base, provider);

    expect(result.hashtags).toEqual(["postgres", "backend"]);
  });

  it("sends the slides in order and the final slide's CTA", async () => {
    const { provider, calls } = fakeProvider([written]);
    await generateCaption(base, provider);

    expect(calls).toHaveLength(1);
    expect(calls[0].user).toContain("1. You probably don't need Redis yet");
    expect(calls[0].user).toContain(sampleSlides.final.cta);
  });

  it("retries once when the model returns something unusable", async () => {
    const { provider, calls } = fakeProvider([{ caption: "", hashtags: [] }, written]);

    await expect(generateCaption(base, provider)).resolves.toEqual(written);
    expect(calls).toHaveLength(2);
  });
});

describe("captionText", () => {
  it("puts the hashtags under the caption, each with one #", () => {
    expect(captionText(written)).toBe(
      "The 400ms query was never a caching problem.\n\nIt was a missing index.\n\n#postgres #backend #webdev",
    );
  });
});
