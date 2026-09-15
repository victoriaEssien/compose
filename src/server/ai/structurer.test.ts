import { describe, expect, it } from "vitest";

import { defaultBrandKit } from "@/types/brand";
import type { GeneratePostInput } from "@/types/post";
import { structurePrompt } from "./prompts/structure.v1";
import type { AiProvider, JsonRequest } from "./provider";
import { maxSupportingPoints, structureLimits } from "./schemas";
import type { ContentAnalysis } from "./schemas";
import { structureContent } from "./structurer";

const input: GeneratePostInput = {
  content: "If your migrations are not part of your deploy, they will get forgotten.",
  context: null,
  postType: "opinion",
  tone: null,
};

const analysis: ContentAnalysis = {
  topic: "Running migrations as part of the deploy",
  audience: "Developers shipping to Vercel",
  tone: "Direct",
  postType: "opinion",
  complexity: "intermediate",
  suggestedSlideCount: 5,
};

const structure = {
  hook: "If migrations are not part of your deploy, they get forgotten",
  body: null,
  supportingPoints: [
    { title: "Put it in the build", detail: "Migrations run before code serves." },
  ],
  conclusion: "Broken schema never reaches production.",
  cta: "Move your migrations into the build",
};

function fakeProvider(responses: unknown[]) {
  const queue = responses.map((value) => JSON.stringify(value));
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

describe("structurePrompt", () => {
  const { system } = structurePrompt.build(input, analysis, defaultBrandKit);

  /** The model kept overrunning cta because the prompt never named the limit. */
  it("tells the model every limit the schema enforces", () => {
    for (const limit of Object.values(structureLimits)) {
      expect(system).toContain(String(limit));
    }
    expect(system).toContain(String(maxSupportingPoints));
  });

  it("says that body may be null, so an empty one is not a failure", () => {
    expect(system).toMatch(/body:.*Null when/);
  });
});

describe("structureContent", () => {
  it("accepts a structure with no body", async () => {
    const { provider } = fakeProvider([structure]);

    const result = await structureContent(provider, input, analysis, defaultBrandKit);

    expect(result.body).toBeNull();
    expect(result.cta).toBe("Move your migrations into the build");
  });

  it("still rejects a cta that overruns the slide", async () => {
    const tooLong = { ...structure, cta: "a".repeat(structureLimits.cta + 1) };
    const { provider } = fakeProvider([tooLong, tooLong]);

    await expect(structureContent(provider, input, analysis, defaultBrandKit)).rejects.toThrow(
      /^structure\.v1:/,
    );
  });
});
