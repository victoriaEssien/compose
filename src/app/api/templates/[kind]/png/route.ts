import { currentUserId } from "@/server/auth";
import { loadBrandKit } from "@/server/brand";
import { parseFormat } from "@/server/render/post";
import { slidePng } from "@/server/render/slide";
import { sampleSlides } from "@/templates/fixtures";
import { brandKitSchema } from "@/types/brand";
import type { BrandKit } from "@/types/brand";
import { templateKindSchema } from "@/types/slide";

/**
 * An unsaved kit, so the Brand Kit page can preview edits through the real
 * renderer instead of a hand-written stand-in. Anything unparseable falls back
 * to the saved kit, which is what a half-typed hex code looks like.
 */
function draftKit(raw: string | null): BrandKit | null {
  if (!raw) return null;

  try {
    const parsed = brandKitSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * One sample slide per template, in the signed-in user's own brand.
 *
 * Nine layouts used to be chosen from a text dropdown, which is pure recall in a
 * product built for people who cannot picture a layout. Serving these as images
 * keeps the gallery off the editor's render path: nothing is drawn until the
 * picker is opened.
 */
export async function GET(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const userId = await currentUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const parsed = templateKindSchema.safeParse((await params).kind);
  if (!parsed.success) return new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  const draft = draftKit(url.searchParams.get("kit"));
  const brand = draft ?? (await loadBrandKit(userId));
  const format = parseFormat(url.searchParams.get("format"));

  const rendered = await slidePng(
    { content: sampleSlides[parsed.data], designConfig: null, imageUrl: null, index: 0 },
    brand,
    format,
    3,
  );

  const response = new Response(rendered.body, rendered);
  // Fixture plus Brand Kit, so it only changes when the kit does.
  response.headers.set("Cache-Control", "private, max-age=300");

  return response;
}
