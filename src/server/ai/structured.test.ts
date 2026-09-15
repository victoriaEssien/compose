import { describe, expect, it } from "vitest";
import { z } from "zod";

import type { AiProvider, JsonRequest } from "./provider";
import { AiError, generateStructured, trimTo } from "./structured";

const schema = z.object({ title: z.string().min(1).max(10) });

function fakeProvider(responses: string[]) {
  const calls: JsonRequest[] = [];

  const provider: AiProvider = {
    async generateJson(request) {
      calls.push(request);
      const next = responses.shift();
      if (next === undefined) throw new Error("the fake provider ran out of responses");
      return next;
    },
  };

  return { provider, calls };
}

function request(provider: AiProvider) {
  return generateStructured(provider, {
    name: "test.v1",
    system: "system",
    user: "user",
    schema,
  });
}

describe("generateStructured", () => {
  it("returns the parsed value when the model answers correctly", async () => {
    const { provider, calls } = fakeProvider(['{"title":"Caching"}']);

    await expect(request(provider)).resolves.toEqual({ title: "Caching" });
    expect(calls).toHaveLength(1);
  });

  it("sends the schema to the model with oneOf rewritten to anyOf", async () => {
    const union = z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("a"), a: z.string() }),
      z.object({ kind: z.literal("b"), b: z.string() }),
    ]);
    const { provider, calls } = fakeProvider(['{"value":{"kind":"a","a":"x"}}']);

    await generateStructured(provider, {
      name: "test.v1",
      system: "system",
      user: "user",
      schema: union,
    });

    const sent = JSON.stringify(calls[0]?.jsonSchema);
    expect(sent).toContain("anyOf");
    expect(sent).not.toContain("oneOf");
    expect(sent).not.toContain("$schema");
    // OpenAI rejects a non-object root, so a bare union is wrapped and unwrapped again.
    expect(calls[0]?.jsonSchema.type).toBe("object");
  });

  it("retries once when the model returns something that is not JSON", async () => {
    const { provider, calls } = fakeProvider(["sorry, here you go:", '{"title":"Caching"}']);

    await expect(request(provider)).resolves.toEqual({ title: "Caching" });
    expect(calls).toHaveLength(2);
    expect(calls[1]?.user).toContain("not valid JSON");
  });

  it("retries once when the model breaks the schema, and tells it what was wrong", async () => {
    const { provider, calls } = fakeProvider(['{"title":42}', '{"title":"Caching"}']);

    await expect(request(provider)).resolves.toEqual({ title: "Caching" });
    expect(calls).toHaveLength(2);
    expect(calls[1]?.user).toContain("title");
  });

  it("gives up after the second failure and names the stage", async () => {
    const { provider, calls } = fakeProvider(['{"title":""}', '{"title":""}']);

    await expect(request(provider)).rejects.toThrow(AiError);
    expect(calls).toHaveLength(2);
  });

  it("puts the stage name in the error message", async () => {
    const { provider } = fakeProvider(["nope", "still nope"]);

    await expect(request(provider)).rejects.toThrow(/^test\.v1:/);
  });
});

describe("trimTo", () => {
  it("leaves text that already fits", () => {
    expect(trimTo("short", 20)).toBe("short");
  });

  it("prefers to end on a sentence", () => {
    const value = "Read the query plan first. Then decide whether you need a cache at all.";

    expect(trimTo(value, 40)).toBe("Read the query plan first.");
  });

  it("falls back to a word boundary with an ellipsis", () => {
    const trimmed = trimTo("supercalifragilistic expialidocious wording here", 30);

    expect(trimmed.length).toBeLessThanOrEqual(30);
    expect(trimmed.endsWith("…")).toBe(true);
    expect(trimmed).not.toMatch(/s…$/);
  });

  it("never exceeds the limit", () => {
    for (const max of [10, 40, 80, 200]) {
      expect(trimTo("word ".repeat(200), max).length).toBeLessThanOrEqual(max);
    }
  });
});

describe("generateStructured length repair", () => {
  const slide = z.object({ template: z.literal("final"), body: z.string().max(40) });

  it("trims an overlong field instead of burning a retry", async () => {
    const long =
      "Caching cannot fix what the database is doing slowly on purpose, so read the plan.";
    const { provider, calls } = fakeProvider([JSON.stringify({ template: "final", body: long })]);

    const result = await generateStructured(provider, {
      name: "test.v1",
      system: "system",
      user: "user",
      schema: slide,
    });

    expect(result.body.length).toBeLessThanOrEqual(40);
    expect(calls).toHaveLength(1);
  });

  it("still retries when the problem is not just length", async () => {
    const wrong = JSON.stringify({ template: "cover", body: "fits" });
    const { provider, calls } = fakeProvider([
      wrong,
      JSON.stringify({ template: "final", body: "fits" }),
    ]);

    await generateStructured(provider, {
      name: "test.v1",
      system: "system",
      user: "user",
      schema: slide,
    });

    expect(calls).toHaveLength(2);
  });
});
