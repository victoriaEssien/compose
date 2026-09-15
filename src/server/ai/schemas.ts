/** Shapes the AI returns at each stage (spec section 17). Server-side only. */
import "server-only";
import { z } from "zod";

import { maxSlides, postTypeSchema } from "@/types/post";

/** One source for the budgets, so the prompt can quote what it is aiming at. */
export const structureLimits = {
  hook: 120,
  body: 600,
  pointTitle: 60,
  pointDetail: 280,
  conclusion: 300,
  cta: 80,
} as const;

// None of this is rendered, so the bound is only sanity. Headroom lets the
// planner trim rather than lose a post over a CTA eight characters long.
const room = (target: number) => Math.round(target * 1.6);

/** What the schema will actually accept, as opposed to what the prompt asks for. */
export const structureCeilings = Object.fromEntries(
  Object.entries(structureLimits).map(([field, target]) => [field, room(target)]),
) as Record<keyof typeof structureLimits, number>;

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
  hook: z.string().min(1).max(room(structureLimits.hook)),
  /**
   * Nullable because the planner also receives the points, the conclusion and the
   * original content. An empty answer should not fail a whole post.
   */
  body: z.string().max(room(structureLimits.body)).nullable(),
  supportingPoints: z
    .array(
      z.object({
        title: z.string().min(1).max(room(structureLimits.pointTitle)),
        detail: z.string().min(1).max(room(structureLimits.pointDetail)),
      }),
    )
    .min(1)
    .max(maxSupportingPoints),
  conclusion: z.string().min(1).max(room(structureLimits.conclusion)),
  cta: z.string().min(1).max(room(structureLimits.cta)),
});

export type ContentAnalysis = z.infer<typeof contentAnalysisSchema>;
export type ContentStructure = z.infer<typeof contentStructureSchema>;
