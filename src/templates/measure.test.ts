import { describe, expect, it } from "vitest";

import { countLines, fitStack, measureText } from "./measure";
import type { TextBlock } from "./measure";

const inter = { family: "Inter", weight: 400 } as const;
const mono = { family: "JetBrains Mono", weight: 400 } as const;

describe("measureText", () => {
  it("is zero for empty text", () => {
    expect(measureText("", inter, 32)).toBe(0);
  });

  it("scales linearly with font size", () => {
    expect(measureText("hello", inter, 64)).toBeCloseTo(measureText("hello", inter, 32) * 2, 6);
  });

  it("gives every mono glyph the same advance", () => {
    expect(measureText("iii", mono, 20)).toBeCloseTo(measureText("WWW", mono, 20), 6);
  });

  // The whole reason character limits were the wrong tool.
  it("separates narrow from wide text of equal length", () => {
    expect(measureText("W".repeat(20), inter, 32)).toBeGreaterThan(
      measureText("i".repeat(20), inter, 32) * 3,
    );
  });

  it("falls back to a known family for an unknown one", () => {
    expect(measureText("hello", { family: "Comic Sans", weight: 400 }, 32)).toBeGreaterThan(0);
  });

  it("bills an unmapped glyph at the fallback width", () => {
    expect(measureText("漢", inter, 32)).toBeGreaterThan(0);
  });
});

describe("countLines", () => {
  it("is zero for empty text", () => {
    expect(countLines("", inter, 32, 500)).toBe(0);
  });

  it("keeps text that fits on one line", () => {
    expect(countLines("short", inter, 32, 500)).toBe(1);
  });

  it("wraps at word boundaries", () => {
    const text = "one two three four five six seven eight nine ten";
    const width = measureText("one two three", inter, 32);

    expect(countLines(text, inter, 32, width)).toBeGreaterThan(3);
  });

  it("splits a single word too wide for the box", () => {
    const word = "supercalifragilistic";
    const width = measureText(word, inter, 32) / 3;

    expect(countLines(word, inter, 32, width)).toBe(3);
  });

  it("counts an explicit newline as a new line", () => {
    expect(countLines("a\nb\nc", inter, 32, 500)).toBe(3);
  });

  it("needs more lines as the box narrows", () => {
    const text = "the quick brown fox jumps over the lazy dog";
    const wide = countLines(text, inter, 32, 900);
    const narrow = countLines(text, inter, 32, 300);

    expect(narrow).toBeGreaterThan(wide);
  });

  it("does not loop forever on a zero width box", () => {
    expect(countLines("anything", inter, 32, 0)).toBe(1);
  });
});

const block = (text: string, size: number, min = 12): TextBlock => ({
  text,
  font: inter,
  size,
  lineHeight: 1.4,
  min,
});

describe("fitStack", () => {
  it("leaves text that already fits at its brand size", () => {
    const sizes = fitStack([block("short", 54)], { width: 900, height: 600 });

    expect(sizes).toEqual([54]);
  });

  it("shrinks text that would overflow", () => {
    const long = "word ".repeat(120);
    const sizes = fitStack([block(long, 54)], { width: 900, height: 400 });

    expect(sizes[0]).toBeLessThan(54);
  });

  it("actually makes it fit", () => {
    const long = "word ".repeat(120);
    const box = { width: 900, height: 400 };

    const [size] = fitStack([block(long, 54)], box);
    const height = countLines(long, inter, size, box.width) * size * 1.4;

    expect(height).toBeLessThanOrEqual(box.height);
  });

  it("keeps the hierarchy when it shrinks a stack", () => {
    const blocks = [block("A heading that runs on".repeat(3), 54), block("Body ".repeat(80), 32)];

    const [heading, body] = fitStack(blocks, { width: 900, height: 400 });

    expect(heading).toBeGreaterThan(body);
  });

  it("never goes below the readability floor", () => {
    const sizes = fitStack([block("word ".repeat(400), 54, 20)], { width: 900, height: 100 });

    expect(sizes[0]).toBe(20);
  });

  it("counts fixed height against the budget", () => {
    const text = "word ".repeat(30);
    const [loose] = fitStack([block(text, 54)], { width: 900, height: 600 });
    const [tight] = fitStack([block(text, 54)], { width: 900, height: 600, fixed: 400 });

    expect(tight).toBeLessThan(loose);
  });

  it("charges an inset to the block that declares it", () => {
    const text = "word ".repeat(40);
    const [plain] = fitStack([block(text, 40)], { width: 900, height: 300 });
    const [inset] = fitStack([{ ...block(text, 40), inset: 300 }], { width: 900, height: 300 });

    expect(inset).toBeLessThan(plain);
  });

  it("handles an empty stack", () => {
    expect(fitStack([], { width: 900, height: 400 })).toEqual([]);
  });
});
