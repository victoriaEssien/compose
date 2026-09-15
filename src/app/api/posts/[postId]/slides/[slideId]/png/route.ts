import { currentUserId } from "@/server/auth";
import { loadRenderablePost, parseFormat } from "@/server/render/post";
import { slidePng } from "@/server/render/slide";
import { hasPlaceholderHandle } from "@/types/brand";

/**
 * Two callers with different needs: the Download link, which produces a file the
 * user will publish, and the dashboard thumbnail, which is just the app looking
 * at its own work. Only the first has to refuse a placeholder handle.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string; slideId: string }> },
) {
  const userId = await currentUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { postId, slideId } = await params;
  const found = await loadRenderablePost(userId, postId);
  if (!found) return new Response("Not found", { status: 404 });

  const index = found.slides.findIndex((row) => row.id === slideId);
  if (index < 0) return new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  const download = url.searchParams.get("download") === "1";

  if (download && hasPlaceholderHandle(found.brand)) {
    return new Response("Set your handle in the Brand Kit before downloading.", { status: 409 });
  }

  const rendered = await slidePng(
    found.inputs[index],
    found.brand,
    parseFormat(url.searchParams.get("format")),
    found.inputs.length,
    found.assetUrls,
  );

  // Deliberately does not mark the post exported. Downloading one slide is how
  // you inspect it, and inspecting a draft should not move it out of Drafts.
  const response = new Response(rendered.body, rendered);

  if (!download) {
    // Private: this is one user's unpublished work. Revalidated by the editor
    // changing the slide, which changes nothing in the URL, so keep it short.
    response.headers.set("Cache-Control", "private, max-age=60");
  }

  return response;
}
