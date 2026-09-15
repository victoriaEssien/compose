/** Builds the render context a template needs, then draws it. */
import "server-only";
import { ImageResponse } from "next/og";
import type { ReactElement } from "react";

import { renderSlide, slideTheme } from "@/templates";
import type { SlideFormat } from "@/templates";
import type { BrandKit } from "@/types/brand";
import type { SlideDesignConfig, SlideSpec } from "@/types/slide";
import { highlightCode } from "./highlight";
import { satoriFonts } from "./fonts";

export type SlideInput = {
  content: SlideSpec;
  designConfig: SlideDesignConfig | null;
  index: number;
};

/**
 * Resolves the async parts Satori cannot do itself: syntax tokens and the URL
 * behind an assetId.
 */
export async function slideElement(
  input: SlideInput,
  brand: BrandKit,
  format: SlideFormat,
  total: number,
  assetUrls: Map<string, string> = new Map(),
): Promise<ReactElement> {
  const theme = slideTheme(brand, format, input.designConfig ?? {});
  const { content } = input;

  const codeLines =
    content.template === "code"
      ? await highlightCode(content.code, content.language, brand.style.codeBlock)
      : null;

  const assetId =
    content.template === "screenshot" || content.template === "project" ? content.assetId : null;

  return renderSlide({
    slide: content,
    brand,
    theme,
    index: input.index,
    total,
    codeLines,
    imageUrl: assetId ? (assetUrls.get(assetId) ?? null) : null,
  });
}

export async function slidePng(
  input: SlideInput,
  brand: BrandKit,
  format: SlideFormat,
  total: number,
  assetUrls?: Map<string, string>,
) {
  const theme = slideTheme(brand, format);
  const element = await slideElement(input, brand, format, total, assetUrls);

  return new ImageResponse(element, {
    width: theme.width,
    height: theme.height,
    fonts: satoriFonts(brand),
  });
}
