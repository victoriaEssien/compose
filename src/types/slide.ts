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

// Layout belongs to the renderer, so copy cannot smuggle it in as line breaks.
// Code is the one field where newlines are the content.
const line = (max: number) =>
  z
    .string()
    .max(max)
    .refine((value) => !/[\r\n]/.test(value), {
      message: "must be one paragraph, with no line breaks",
    });

const requiredLine = (max: number) =>
  line(max).refine((value) => value.length > 0, { message: "must not be empty" });

/** A hint for the renderer or image step, e.g. "database_icon". Never rendered as text. */
export const visualHintSchema = z.string().min(1).max(slideTextLimits.visual);

const commonShape = {
  visual: visualHintSchema.nullable(),
} as const;

export const coverSlideSchema = z.object({
  ...commonShape,
  template: z.literal("cover"),
  headline: requiredLine(slideTextLimits.headline),
  subheadline: line(slideTextLimits.subheadline).nullable(),
});

export const textSlideSchema = z.object({
  ...commonShape,
  template: z.literal("text"),
  heading: requiredLine(slideTextLimits.heading),
  body: requiredLine(slideTextLimits.body),
});

export const listItemSchema = z.object({
  title: requiredLine(slideTextLimits.itemTitle),
  body: line(slideTextLimits.itemBody).nullable(),
});

export const numberedListSlideSchema = z.object({
  ...commonShape,
  template: z.literal("numbered_list"),
  heading: line(slideTextLimits.heading).nullable(),
  items: z.array(listItemSchema).min(2).max(maxListItems),
});

export const codeSlideSchema = z.object({
  ...commonShape,
  template: z.literal("code"),
  heading: line(slideTextLimits.heading).nullable(),
  language: z.string().min(1).max(slideTextLimits.language),
  code: z.string().min(1).max(slideTextLimits.code),
  explanation: line(slideTextLimits.explanation).nullable(),
});

export const comparisonSideSchema = z.object({
  label: requiredLine(slideTextLimits.comparisonLabel),
  body: requiredLine(slideTextLimits.comparisonBody),
});

export const comparisonSlideSchema = z.object({
  ...commonShape,
  template: z.literal("comparison"),
  heading: line(slideTextLimits.heading).nullable(),
  left: comparisonSideSchema,
  right: comparisonSideSchema,
});

export const quoteSlideSchema = z.object({
  ...commonShape,
  template: z.literal("quote"),
  quote: requiredLine(slideTextLimits.quote),
  attribution: line(slideTextLimits.attribution).nullable(),
});

export const screenshotSlideSchema = z.object({
  ...commonShape,
  template: z.literal("screenshot"),
  heading: line(slideTextLimits.heading).nullable(),
  /** Set by the user in the editor; the AI always emits null. */
  assetId: z.uuid().nullable(),
  caption: line(slideTextLimits.caption).nullable(),
});

export const projectSlideSchema = z.object({
  ...commonShape,
  template: z.literal("project"),
  name: requiredLine(slideTextLimits.projectName),
  description: requiredLine(slideTextLimits.projectDescription),
  /** Set by the user in the editor; the AI always emits null. */
  assetId: z.uuid().nullable(),
  url: z.url().nullable(),
});

export const finalSlideSchema = z.object({
  ...commonShape,
  template: z.literal("final"),
  heading: requiredLine(slideTextLimits.heading),
  body: line(slideTextLimits.finalBody).nullable(),
  cta: requiredLine(slideTextLimits.cta),
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
