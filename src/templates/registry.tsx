import type { ReactElement } from "react";
import type { ZodType } from "zod";

import {
  codeSlideSchema,
  comparisonSlideSchema,
  coverSlideSchema,
  finalSlideSchema,
  numberedListSlideSchema,
  projectSlideSchema,
  quoteSlideSchema,
  screenshotSlideSchema,
  slideTextLimits,
  templateKinds,
  textSlideSchema,
} from "@/types/slide";
import type { SlideSpecOf, TemplateKind } from "@/types/slide";
import {
  CodeSlide,
  ComparisonSlide,
  CoverSlide,
  FinalSlide,
  NumberedListSlide,
  ProjectSlide,
  QuoteSlide,
  ScreenshotSlide,
  TextSlide,
} from "./slides";
import { templateNames } from "./names";
import type { SlideRenderContext } from "./types";

export type TemplateDefinition<K extends TemplateKind> = {
  id: K;
  name: string;
  schema: ZodType<SlideSpecOf<K>>;
  /** Longest text field, so the editor can warn before the schema rejects. */
  textLimit: number;
  render: (context: SlideRenderContext<K>) => ReactElement;
};

export const templates = {
  cover: {
    id: "cover",
    name: templateNames.cover,
    schema: coverSlideSchema,
    textLimit: slideTextLimits.headline,
    render: CoverSlide,
  },
  text: {
    id: "text",
    name: templateNames.text,
    schema: textSlideSchema,
    textLimit: slideTextLimits.body,
    render: TextSlide,
  },
  numbered_list: {
    id: "numbered_list",
    name: templateNames.numbered_list,
    schema: numberedListSlideSchema,
    textLimit: slideTextLimits.itemBody,
    render: NumberedListSlide,
  },
  code: {
    id: "code",
    name: templateNames.code,
    schema: codeSlideSchema,
    textLimit: slideTextLimits.code,
    render: CodeSlide,
  },
  comparison: {
    id: "comparison",
    name: templateNames.comparison,
    schema: comparisonSlideSchema,
    textLimit: slideTextLimits.comparisonBody,
    render: ComparisonSlide,
  },
  quote: {
    id: "quote",
    name: templateNames.quote,
    schema: quoteSlideSchema,
    textLimit: slideTextLimits.quote,
    render: QuoteSlide,
  },
  screenshot: {
    id: "screenshot",
    name: templateNames.screenshot,
    schema: screenshotSlideSchema,
    textLimit: slideTextLimits.caption,
    render: ScreenshotSlide,
  },
  project: {
    id: "project",
    name: templateNames.project,
    schema: projectSlideSchema,
    textLimit: slideTextLimits.projectDescription,
    render: ProjectSlide,
  },
  final: {
    id: "final",
    name: templateNames.final,
    schema: finalSlideSchema,
    textLimit: slideTextLimits.finalBody,
    render: FinalSlide,
  },
} satisfies { [K in TemplateKind]: TemplateDefinition<K> };

export const templateList = templateKinds.map((kind) => templates[kind]);

/** The one place a slide turns into JSX, for both the preview and the PNG. */
export function renderSlide(context: SlideRenderContext): ReactElement {
  const template = templates[context.slide.template];

  // The union guarantees slide matches its own template, which the generic signature cannot express.
  return (template.render as (context: SlideRenderContext) => ReactElement)(context);
}
