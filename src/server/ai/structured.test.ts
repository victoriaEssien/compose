import { describe, expect, it } from "vitest";
import { z } from "zod";

import type { AiProvider, JsonRequest } from "./provider";
import { AiError, generateStructured } from "./structured";

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
    const { provider, calls } = fakeProvider(['{"kind":"a","a":"x"}']);

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
  });

  it("retries once when the model returns something that is not JSON", async () => {
    const { provider, calls } = fakeProvider(["sorry, here you go:", '{"title":"Caching"}']);

    await expect(request(provider)).resolves.toEqual({ title: "Caching" });
    expect(calls).toHaveLength(2);
    expect(calls[1]?.user).toContain("not valid JSON");
  });

  it("retries once when the model breaks the schema, and tells it what was wrong", async () => {
    const { provider, calls } = fakeProvider([
      '{"title":"far too long to fit"}',
      '{"title":"Caching"}',
    ]);

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
