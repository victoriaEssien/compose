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
