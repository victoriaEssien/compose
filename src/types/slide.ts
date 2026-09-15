/** Slide templates (spec section 11) and the content the AI produces (spec sections 12, 26). */

// Optional fields are `.nullable()`, not `.optional()`: OpenAI structured
// outputs require every key to be present.
import { z } from "zod";

import { hexColorSchema } from "./brand";

export const templateKinds = [
  "cover",
  "text",
  "numbered_list",
  "code",
  "comparison",
  "quote",
  "screenshot",
  "project",
  "final",
] as const;

export const templateKindSchema = z.enum(templateKinds);
export type TemplateKind = z.infer<typeof templateKindSchema>;

/** One source for the budgets, so prompts can quote what the schema enforces (spec section 9). */
export const slideTextLimits = {
  headline: 70,
  heading: 60,
  subheadline: 120,
  body: 280,
  itemTitle: 40,
  itemBody: 140,
  code: 600,
  language: 20,
  explanation: 200,
  comparisonLabel: 30,
  comparisonBody: 160,
  quote: 200,
  attribution: 60,
  caption: 160,
  projectName: 40,
  projectDescription: 200,
  finalBody: 200,
  cta: 80,
  visual: 60,
} as const;

export const maxListItems = 5;

/** A hint for the renderer or image step, e.g. "database_icon". Never rendered as text. */
export const visualHintSchema = z.string().min(1).max(slideTextLimits.visual);

const commonShape = {
  visual: visualHintSchema.nullable(),
} as const;

export const coverSlideSchema = z.object({
  ...commonShape,
  template: z.literal("cover"),
  headline: z.string().min(1).max(slideTextLimits.headline),
  subheadline: z.string().max(slideTextLimits.subheadline).nullable(),
});

export const textSlideSchema = z.object({
  ...commonShape,
  template: z.literal("text"),
  heading: z.string().min(1).max(slideTextLimits.heading),
  body: z.string().min(1).max(slideTextLimits.body),
});

export const listItemSchema = z.object({
  title: z.string().min(1).max(slideTextLimits.itemTitle),
  body: z.string().max(slideTextLimits.itemBody).nullable(),
});

export const numberedListSlideSchema = z.object({
  ...commonShape,
  template: z.literal("numbered_list"),
  heading: z.string().max(slideTextLimits.heading).nullable(),
  items: z.array(listItemSchema).min(2).max(maxListItems),
});

export const codeSlideSchema = z.object({
  ...commonShape,
  template: z.literal("code"),
  heading: z.string().max(slideTextLimits.heading).nullable(),
  language: z.string().min(1).max(slideTextLimits.language),
  code: z.string().min(1).max(slideTextLimits.code),
  explanation: z.string().max(slideTextLimits.explanation).nullable(),
});

export const comparisonSideSchema = z.object({
  label: z.string().min(1).max(slideTextLimits.comparisonLabel),
  body: z.string().min(1).max(slideTextLimits.comparisonBody),
});

export const comparisonSlideSchema = z.object({
  ...commonShape,
  template: z.literal("comparison"),
  heading: z.string().max(slideTextLimits.heading).nullable(),
  left: comparisonSideSchema,
  right: comparisonSideSchema,
});

export const quoteSlideSchema = z.object({
  ...commonShape,
  template: z.literal("quote"),
  quote: z.string().min(1).max(slideTextLimits.quote),
  attribution: z.string().max(slideTextLimits.attribution).nullable(),
});

export const screenshotSlideSchema = z.object({
  ...commonShape,
  template: z.literal("screenshot"),
  heading: z.string().max(slideTextLimits.heading).nullable(),
  /** Set by the user in the editor; the AI always emits null. */
  assetId: z.uuid().nullable(),
  caption: z.string().max(slideTextLimits.caption).nullable(),
});

export const projectSlideSchema = z.object({
  ...commonShape,
  template: z.literal("project"),
  name: z.string().min(1).max(slideTextLimits.projectName),
  description: z.string().min(1).max(slideTextLimits.projectDescription),
  /** Set by the user in the editor; the AI always emits null. */
  assetId: z.uuid().nullable(),
  url: z.url().nullable(),
});

export const finalSlideSchema = z.object({
  ...commonShape,
  template: z.literal("final"),
  heading: z.string().min(1).max(slideTextLimits.heading),
  body: z.string().max(slideTextLimits.finalBody).nullable(),
  cta: z.string().min(1).max(slideTextLimits.cta),
});

export const slideSpecSchema = z.discriminatedUnion("template", [
  coverSlideSchema,
  textSlideSchema,
  numberedListSlideSchema,
  codeSlideSchema,
  comparisonSlideSchema,
  quoteSlideSchema,
  screenshotSlideSchema,
  projectSlideSchema,
  finalSlideSchema,
]);

export type SlideSpec = z.infer<typeof slideSpecSchema>;
export type SlideSpecOf<K extends TemplateKind> = Extract<SlideSpec, { template: K }>;

/** Per-slide overrides applied on top of the Brand Kit (spec section 13). */
export const slideDesignConfigSchema = z
  .object({
    backgroundColor: hexColorSchema,
    textColor: hexColorSchema,
    accentColor: hexColorSchema,
    fontScale: z.number().min(0.6).max(1.6),
    align: z.enum(["left", "center"]),
  })
  .partial();

export type SlideDesignConfig = z.infer<typeof slideDesignConfigSchema>;
