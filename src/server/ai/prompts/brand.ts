/** The Brand Kit section every prompt carries (spec sections 15 and 27). */
import "server-only";
import type { BrandKit } from "@/types/brand";

export function brandBrief(brand: BrandKit) {
  return [
    `Brand: ${brand.name} (${brand.username})`,
    `Illustration style: ${brand.style.illustration}. Code block style: ${brand.style.codeBlock}.`,
    brand.voice
      ? `Voice, follow this exactly:\n${brand.voice}`
      : "Voice: not set. Write plainly and directly, with no marketing language.",
  ].join("\n");
}
