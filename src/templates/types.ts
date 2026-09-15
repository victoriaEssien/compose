import type { BrandKit } from "@/types/brand";
import type { SlideSpecOf, TemplateKind } from "@/types/slide";
import type { SlideTheme } from "./theme";

/** One highlighted run of code. Shiki types stay out of the templates. */
export type CodeToken = { text: string; color: string };
export type CodeLine = CodeToken[];

export type SlideRenderContext<K extends TemplateKind = TemplateKind> = {
  slide: SlideSpecOf<K>;
  brand: BrandKit;
  theme: SlideTheme;
  index: number;
  total: number;
  /** Pre-tokenised, because Shiki is async and Satori is not. */
  codeLines: CodeLine[] | null;
  /** Resolved from assetId before rendering. */
  imageUrl: string | null;
  /** A generated illustration for the visual hint, when one has been made. */
  illustrationUrl: string | null;
};
