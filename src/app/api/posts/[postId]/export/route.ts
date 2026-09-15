import { zipSync } from "fflate";

import { currentUserId } from "@/server/auth";
import { loadRenderablePost, parseFormat } from "@/server/render/post";
import { slidePng } from "@/server/render/slide";

function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "post"
  );
}

export async function GET(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  const userId = await currentUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { postId } = await params;
  const found = await loadRenderablePost(userId, postId);
  if (!found) return new Response("Not found", { status: 404 });

  const format = parseFormat(new URL(request.url).searchParams.get("format"));

  const rendered = await Promise.all(
    found.inputs.map(async (input) => {
      const response = await slidePng(
        input,
        found.brand,
        format,
        found.inputs.length,
        found.assetUrls,
      );
      return new Uint8Array(await response.arrayBuffer());
    }),
  );

  const name = slugify(found.post.title);
  const files = Object.fromEntries(
    rendered.map((bytes, index) => [`${name}-${String(index + 1).padStart(2, "0")}.png`, bytes]),
  );

  return new Response(zipSync(files, { level: 0 }) as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${name}.zip"`,
    },
  });
}
