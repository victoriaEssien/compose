/** Instagram caption and hashtags for a finished post (spec section 20). */
import { z } from "zod";

export const captionSchema = z.object({
  /** Instagram's own ceiling, hashtags included. */
  caption: z.string().min(1).max(2200),
  hashtags: z.array(z.string().min(1).max(40)).min(1).max(12),
});

export type Caption = z.infer<typeof captionSchema>;

/** What actually goes in the Instagram box, which is why the editor copies this. */
export function captionText({ caption, hashtags }: Caption) {
  return `${caption.trim()}\n\n${hashtags.map((tag) => `#${tag}`).join(" ")}`;
}
