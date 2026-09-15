/**
 * Template display names, kept apart from the registry so the editor can label a
 * dropdown without pulling the renderer and its font metrics into the browser.
 */
import type { TemplateKind } from "@/types/slide";

export const templateNames: Record<TemplateKind, string> = {
  cover: "Cover",
  text: "Text",
  numbered_list: "Numbered list",
  code: "Code",
  comparison: "Comparison",
  quote: "Quote",
  screenshot: "Screenshot",
  project: "Project",
  final: "Final slide",
};
