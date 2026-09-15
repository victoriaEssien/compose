import { describe, expect, it } from "vitest";

import { defaultBrandKit, hasPlaceholderHandle, isDefaultBrandKit } from "./brand";

describe("isDefaultBrandKit", () => {
  it("is true for the untouched seed", () => {
    expect(isDefaultBrandKit(defaultBrandKit)).toBe(true);
  });

  it("is false once any field is changed, not just the name", () => {
    const tweaked = [
      { ...defaultBrandKit, name: "The Codebreaker" },
      { ...defaultBrandKit, username: "@codebreaker" },
      { ...defaultBrandKit, voice: "Direct, technical, funny when it earns it." },
      { ...defaultBrandKit, fonts: { primary: "Playfair Display", secondary: "Inter" } as const },
      {
        ...defaultBrandKit,
        colors: { ...defaultBrandKit.colors, accent: "#FF0055" },
      },
      {
        ...defaultBrandKit,
        style: { ...defaultBrandKit.style, card: "glass" } as const,
      },
      { ...defaultBrandKit, logoUrl: "https://example.com/logo.png" },
    ];

    for (const kit of tweaked) expect(isDefaultBrandKit(kit)).toBe(false);
  });

  it("does not depend on key order", () => {
    const reordered = {
      voice: defaultBrandKit.voice,
      style: defaultBrandKit.style,
      colors: defaultBrandKit.colors,
      fonts: defaultBrandKit.fonts,
      avatarUrl: defaultBrandKit.avatarUrl,
      logoUrl: defaultBrandKit.logoUrl,
      username: defaultBrandKit.username,
      name: defaultBrandKit.name,
    };

    expect(isDefaultBrandKit(reordered)).toBe(true);
  });
});

describe("hasPlaceholderHandle", () => {
  it("catches the seeded handle, which is drawn into every exported slide", () => {
    expect(hasPlaceholderHandle(defaultBrandKit)).toBe(true);
    expect(hasPlaceholderHandle({ ...defaultBrandKit, username: " @yourhandle " })).toBe(true);
  });

  it("passes a kit that is otherwise untouched but has a real handle", () => {
    expect(hasPlaceholderHandle({ ...defaultBrandKit, username: "@codebreaker" })).toBe(false);
  });
});
