import type { SlideDesignConfig, SlideSpec, TemplateKind } from "@/types/slide";

export type EditableSlide = {
  id: string;
  template: TemplateKind;
  content: SlideSpec;
  designConfig: SlideDesignConfig | null;
  imageUrl: string | null;
};

/** What the editor is holding, and which slide it belongs to. */
export type SlideDraft = {
  id: string;
  content: SlideSpec;
  design: SlideDesignConfig;
};

/**
 * Compared by value. An absent designConfig reads as {}, and a fresh {} is never
 * reference-equal to the last one, which is how the autosave used to loop forever.
 */
export function slideSignature(id: string, content: SlideSpec, design: SlideDesignConfig | null) {
  return `${id}:${JSON.stringify(content)}:${JSON.stringify(design ?? {})}`;
}

export function draftSignature(draft: SlideDraft) {
  return slideSignature(draft.id, draft.content, draft.design);
}

export function serverSignature(slide: EditableSlide) {
  return slideSignature(slide.id, slide.content, slide.designConfig);
}

export function draftFor(slide: EditableSlide): SlideDraft {
  return { id: slide.id, content: slide.content, design: slide.designConfig ?? {} };
}

/**
 * Selecting another slide re-renders before the draft catches up, so the draft
 * can briefly belong to the slide you just left. Saving then would write the old
 * slide's content onto the new one.
 */
export function shouldAutosave(draft: SlideDraft, slide: EditableSlide) {
  if (draft.id !== slide.id) return false;

  return draftSignature(draft) !== serverSignature(slide);
}
