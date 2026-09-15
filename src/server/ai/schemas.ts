/** Shapes the AI returns at each stage (spec section 17). Server-side only. */
import "server-only";
import { z } from "zod";

import { maxSlides, postTypeSchema } from "@/types/post";

/** One source for the budgets, so the prompt can quote what the schema enforces. */
export const structureLimits = {
  hook: 120,
  body: 600,
  pointTitle: 60,
  pointDetail: 280,
  conclusion: 300,
  cta: 80,
} as const;

export const maxSupportingPoints = 6;

export const contentAnalysisSchema = z.object({
  topic: z.string().min(1).max(120),
  audience: z.string().min(1).max(120),
  tone: z.string().min(1).max(60),
  postType: postTypeSchema,
  complexity: z.enum(["beginner", "intermediate", "advanced"]),
  suggestedSlideCount: z.number().int().min(1).max(maxSlides),
});

export const contentStructureSchema = z.object({
  hook: z.string().min(1).max(structureLimits.hook),
  /**
   * Nullable because the planner also receives the points, the conclusion and the
   * original content. An empty answer should not fail a whole post.
   */
  body: z.string().max(structureLimits.body).nullable(),
  supportingPoints: z
    .array(
      z.object({
        title: z.string().min(1).max(structureLimits.pointTitle),
        detail: z.string().min(1).max(structureLimits.pointDetail),
      }),
    )
    .min(1)
    .max(maxSupportingPoints),
  conclusion: z.string().min(1).max(structureLimits.conclusion),
  cta: z.string().min(1).max(structureLimits.cta),
});

export type ContentAnalysis = z.infer<typeof contentAnalysisSchema>;
export type ContentStructure = z.infer<typeof contentStructureSchema>;
