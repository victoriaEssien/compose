/** Post types (spec section 8), statuses, and the post JSON the AI returns (spec sections 12, 26). */
import { z } from "zod";

import { slideSpecSchema } from "./slide";

export const postTypes = [
  "educational",
  "tutorial",
  "project_showcase",
  "things_i_learned",
  "opinion",
  "tool_recommendation",
  "story",
] as const;

/** What a post actually is, once the Content Analyzer has decided. */
export const postTypeSchema = z.enum(postTypes);
export type PostType = z.infer<typeof postTypeSchema>;

/**
 * What the user picks on the Create Post screen (spec section 22). Only
 * resolved types are ever stored on a post.
 */
export const postTypeRequestSchema = z.enum([...postTypes, "auto"]);
export type PostTypeRequest = z.infer<typeof postTypeRequestSchema>;

/**
 * Lives here rather than on the Create Post screen, because the post page needs
 * the same labels and was printing the raw enum lowercase instead.
 */
export const postTypeLabels: Record<PostTypeRequest, string> = {
  auto: "Auto",
  educational: "Educational",
  tutorial: "Tutorial",
  project_showcase: "Project showcase",
  things_i_learned: "Things I learned",
  opinion: "Opinion",
  tool_recommendation: "Tool recommendation",
  story: "Story",
};

export const postStatuses = ["draft", "ready", "exported"] as const;
export const postStatusSchema = z.enum(postStatuses);
export type PostStatus = z.infer<typeof postStatusSchema>;

/** Instagram carousels cap at 10 images. */
export const maxSlides = 10;

export const postSpecSchema = z
  .object({
    postType: postTypeSchema,
    title: z.string().min(1).max(80),
    slideCount: z.number().int().min(1).max(maxSlides),
    slides: z.array(slideSpecSchema).min(1).max(maxSlides),
  })
  .refine((spec) => spec.slides.length === spec.slideCount, {
    message: "slideCount must match the number of slides",
    path: ["slideCount"],
  });

export type PostSpec = z.infer<typeof postSpecSchema>;

/** Offered on the Create Post screen. Null means "use the brand voice". */
export const tonePresets = ["direct", "technical", "friendly", "playful", "serious"] as const;

export const toneLabels: Record<(typeof tonePresets)[number] | "brand", string> = {
  brand: "Your brand voice",
  direct: "Direct",
  technical: "Technical",
  friendly: "Friendly",
  playful: "Playful",
  serious: "Serious",
};

/**
 * Prefills the Create Post screen so the first run is not an empty box. The
 * paragraph is the one from spec section 7.
 */
export const exampleContent =
  "I spent the last two days debugging this API and eventually realised the problem wasn't the API at all. I was making three database calls where one would have been enough. The fix was a single join and about four lines of code, but finding it meant reading the query log line by line.";

/** What the Create Post screen submits (spec section 22). */
export const generatePostInputSchema = z.object({
  content: z.string().min(20).max(6000),
  context: z.string().max(1000).nullable(),
  postType: postTypeRequestSchema,
  tone: z.string().max(60).nullable(),
});

export type GeneratePostInput = z.infer<typeof generatePostInputSchema>;
