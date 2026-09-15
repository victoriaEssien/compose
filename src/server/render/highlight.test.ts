import { describe, expect, it, vi } from "vitest";

import { highlightCode } from "./highlight";

const cache = globalThis as typeof globalThis & { shikiHighlighter?: Promise<unknown> };

const text = (lines: { text: string }[][]) => lines.map((line) => line.map((t) => t.text).join(""));

describe("highlightCode", () => {
  it("tokenises code into one entry per line", { timeout: 60_000 }, async () => {
    const lines = await highlightCode("const a = 1;\nconst b = 2;", "typescript", "dark");

    expect(text(lines)).toEqual(["const a = 1;", "const b = 2;"]);
    expect(lines[0].length).toBeGreaterThan(1);
  });

  it("resolves an alias to its real grammar", { timeout: 60_000 }, async () => {
    const [viaAlias, viaName] = await Promise.all([
      highlightCode("select 1;", "postgres", "dark"),
      highlightCode("select 1;", "sql", "dark"),
    ]);

    expect(viaAlias).toEqual(viaName);
  });

  it("still returns the text for a language it does not know", { timeout: 60_000 }, async () => {
    const lines = await highlightCode("whatever this is", "brainfuck", "dark");

    expect(text(lines)).toEqual(["whatever this is"]);
  });

  // Each highlighter carries its own WASM and grammars, so repeat calls must share one.
  it("builds a single highlighter for the process", { timeout: 60_000 }, async () => {
    await highlightCode("const a = 1;", "ts", "dark");
    const first = cache.shikiHighlighter;

    expect(first).toBeDefined();

    await highlightCode("print('hi')", "python", "light");

    expect(cache.shikiHighlighter).toBe(first);
  });

  // A dev reload re-evaluates this module. A module-scope cache would miss here.
  it("keeps that highlighter across a module reload", { timeout: 60_000 }, async () => {
    await highlightCode("const a = 1;", "ts", "dark");
    const first = cache.shikiHighlighter;

    expect(first).toBeDefined();

    vi.resetModules();
    const reloaded = await import("./highlight");
    await reloaded.highlightCode("const b = 2;", "ts", "dark");

    expect(cache.shikiHighlighter).toBe(first);
  });
});
