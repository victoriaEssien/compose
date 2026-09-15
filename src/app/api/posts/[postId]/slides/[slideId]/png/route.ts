import { currentUserId } from "@/server/auth";
import { loadRenderablePost, parseFormat } from "@/server/render/post";
import { slidePng } from "@/server/render/slide";

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

  return slidePng(
    found.inputs[index],
    found.brand,
    parseFormat(new URL(request.url).searchParams.get("format")),
    found.inputs.length,
    found.assetUrls,
  );
}
