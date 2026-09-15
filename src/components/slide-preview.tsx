import { cn } from "@/lib/utils";
import { formatSizes } from "@/templates";
import type { SlideFormat } from "@/templates";
import type { SlideInput } from "@/server/render/slide";
import { slideElement } from "@/server/render/slide";
import type { BrandKit } from "@/types/brand";

/**
 * The same element Satori draws, scaled down with a transform. The @font-face
 * rules in globals.css load the same TTFs, so the preview matches the export.
 */
export async function SlidePreview({
  input,
  brand,
  format,
  total,
  assetUrls,
  width,
  className,
}: {
  input: SlideInput;
  brand: BrandKit;
  format: SlideFormat;
  total: number;
  assetUrls: Map<string, string>;
  width: number;
  /** For callers that frame the slide themselves, such as the landing page deck. */
  className?: string;
}) {
  const element = await slideElement(input, brand, format, total, assetUrls);
  const size = formatSizes[format];
  const scale = width / size.width;

  return (
    <div
      className={cn("overflow-hidden rounded-xl border", className)}
      style={{ width, height: Math.round(size.height * scale) }}
    >
      <div
        style={{
          width: size.width,
          height: size.height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {element}
      </div>
    </div>
  );
}
