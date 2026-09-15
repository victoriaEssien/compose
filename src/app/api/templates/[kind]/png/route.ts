import { currentUserId } from "@/server/auth";
import { loadBrandKit } from "@/server/brand";
import { parseFormat } from "@/server/render/post";
import { slidePng } from "@/server/render/slide";
import { sampleSlides } from "@/templates/fixtures";
import { templateKindSchema } from "@/types/slide";

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

  const brand = await loadBrandKit(userId);
  const format = parseFormat(new URL(request.url).searchParams.get("format"));

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
