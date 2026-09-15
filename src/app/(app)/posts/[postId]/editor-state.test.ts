import { describe, expect, it } from "vitest";

import { sampleSlides } from "@/templates/fixtures";
import { draftFor, shouldAutosave } from "./editor-state";
import type { EditableSlide } from "./editor-state";

function slideRow(overrides: Partial<EditableSlide> = {}): EditableSlide {
  return {
    id: "slide-1",
    template: "cover",
    content: sampleSlides.cover,
    designConfig: null,
    imageUrl: null,
    ...overrides,
  };
}

describe("shouldAutosave", () => {
  /** This looped forever: `{} === {}` is false, so the guard never tripped. */
  it("does not save a slide that has no design overrides and no edits", () => {
    const slide = slideRow({ designConfig: null });

    expect(shouldAutosave(draftFor(slide), slide)).toBe(false);
  });

  it("does not save when the draft matches the server by value", () => {
    const slide = slideRow({ designConfig: { align: "center" } });
    const draft = { id: slide.id, content: slide.content, design: { align: "center" as const } };

    expect(shouldAutosave(draft, slide)).toBe(false);
  });

  /** Selecting another slide used to write the previous slide's content onto it. */
  it("refuses to save a draft belonging to a different slide", () => {
    const leaving = slideRow({ id: "slide-1", content: sampleSlides.cover });
    const arriving = slideRow({ id: "slide-5", content: sampleSlides.final, template: "final" });

    expect(shouldAutosave(draftFor(leaving), arriving)).toBe(false);
  });

  it("saves an edit to the slide the draft belongs to", () => {
    const slide = slideRow();
    const edited = {
      ...draftFor(slide),
      content: { ...sampleSlides.cover, headline: "Edited headline" },
    };

    expect(shouldAutosave(edited, slide)).toBe(true);
  });

  it("saves a design override on its own", () => {
    const slide = slideRow({ designConfig: null });
    const restyled = { ...draftFor(slide), design: { accentColor: "#FF0000" } };

    expect(shouldAutosave(restyled, slide)).toBe(true);
  });

  it("stops saving once the server has caught up", () => {
    const edited = { ...sampleSlides.cover, headline: "Edited headline" };
    const slide = slideRow({ content: edited });
    const draft = { id: slide.id, content: edited, design: {} };

    expect(shouldAutosave(draft, slide)).toBe(false);
  });
});
