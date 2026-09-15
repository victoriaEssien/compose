import { describe, expect, it } from "vitest";

import { contrastRatio, isReadable, relativeLuminance } from "./contrast";

describe("relativeLuminance", () => {
  it("anchors at the two extremes", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBe(1);
  });

  it("is null for anything that is not a 6-digit hex", () => {
    for (const value of ["", "#fff", "#12345", "rgb(0,0,0)", "#gggggg", "0B0B0F"]) {
      expect(relativeLuminance(value)).toBeNull();
    }
  });
});

describe("contrastRatio", () => {
  it("gives 21:1 for black on white, either way round", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
  });

  it("gives 1:1 for a colour against itself", () => {
    expect(contrastRatio("#6E56CF", "#6E56CF")).toBeCloseTo(1, 5);
  });

  it("matches a known reference pair", () => {
    // #767676 on white is the canonical "just passes AA" grey.
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });

  it("accepts uppercase and surrounding space", () => {
    expect(contrastRatio(" #FFFFFF ", "#000000")).toBeCloseTo(21, 5);
  });

  it("is null when either colour is unparseable", () => {
    expect(contrastRatio("#fff", "#000000")).toBeNull();
    expect(contrastRatio("#ffffff", "nope")).toBeNull();
  });
});

describe("isReadable", () => {
  it("passes the seeded Brand Kit", () => {
    expect(isReadable("#F5F5F7", "#0B0B0F")).toBe(true);
  });

  it("catches text set to the background colour", () => {
    expect(isReadable("#0B0B0F", "#0B0B0F")).toBe(false);
  });

  it("stays quiet while a hex is still being typed", () => {
    expect(isReadable("#0B0", "#0B0B0F")).toBe(true);
  });
});
