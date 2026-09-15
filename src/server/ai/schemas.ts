/** Shapes the AI returns at each stage (spec section 17). Server-side only. */
import "server-only";
import { z } from "zod";

import { maxSlides, postTypeSchema } from "@/types/post";

export const contentAnalysisSchema = z.object({
  topic: z.string().min(1).max(120),
  audience: z.string().min(1).max(120),
  tone: z.string().min(1).max(60),
  postType: postTypeSchema,
  complexity: z.enum(["beginner", "intermediate", "advanced"]),
  suggestedSlideCount: z.number().int().min(1).max(maxSlides),
});

export const contentStructureSchema = z.object({
  hook: z.string().min(1).max(120),
  body: z.string().min(1).max(1200),
  supportingPoints: z
    .array(
      z.object({
        title: z.string().min(1).max(60),
        detail: z.string().min(1).max(280),
      }),
    )
    .min(1)
    .max(6),
  conclusion: z.string().min(1).max(300),
  cta: z.string().min(1).max(80),
});

export type ContentAnalysis = z.infer<typeof contentAnalysisSchema>;
export type ContentStructure = z.infer<typeof contentStructureSchema>;
