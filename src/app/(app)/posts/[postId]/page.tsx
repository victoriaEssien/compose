import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { listAssets } from "@/server/assets";
import { requireUserId } from "@/server/auth";
import { loadRenderablePost, parseFormat } from "@/server/render/post";
import { slideElement } from "@/server/render/slide";
import { formatSizes } from "@/templates";
import { PostEditor } from "./post-editor";
import { PostStatusSelect } from "./post-status";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ format?: string }>;
}) {
  const userId = await requireUserId();
  const { postId } = await params;
  const [found, assets] = await Promise.all([
    loadRenderablePost(userId, postId),
    listAssets(userId),
  ]);

  if (!found) notFound();

  const format = parseFormat((await searchParams).format ?? null);
  const { post, slides, inputs, brand, assetUrls } = found;

  // Rendered once per slide, then drawn twice at different scales: once in the
  // filmstrip and once on the stage. Elements are reusable, so the expensive
  // part (Shiki, asset lookup) does not run a second time.
  const elements = await Promise.all(
    inputs.map((input) => slideElement(input, brand, format, inputs.length, assetUrls)),
  );

  const size = formatSizes[format];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs">
            {post.type.replaceAll("_", " ")} · {slides.length} slides
          </p>
          <h1 className="mt-2 text-2xl font-semibold">{post.title}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PostStatusSelect postId={post.id} status={post.status} />
          {(["carousel", "square"] as const).map((option) => (
            <Button
              key={option}
              asChild
              size="sm"
              variant={option === format ? "default" : "outline"}
            >
              <Link
                href={`/posts/${post.id}?format=${option}`}
                aria-label={
                  option === "carousel"
                    ? "Carousel format, 1080 by 1350"
                    : "Square format, 1080 by 1080"
                }
              >
                {option === "carousel" ? "4:5" : "1:1"}
              </Link>
            </Button>
          ))}
          <Button asChild size="sm">
            <a href={`/api/posts/${post.id}/export?format=${format}`} download>
              Download all
            </a>
          </Button>
        </div>
      </div>

      <div className="mt-10">
        <PostEditor
          postId={post.id}
          format={format}
          assets={assets}
          brandColors={{
            background: brand.colors.background,
            text: brand.colors.text,
            accent: brand.colors.accent,
          }}
          slides={slides.map((row) => ({
            id: row.id,
            template: row.template,
            content: row.content,
            designConfig: row.designConfig,
            imageUrl: row.imageUrl,
          }))}
          previews={elements}
          thumbs={elements}
          slideWidth={size.width}
          slideHeight={size.height}
        />
      </div>
    </main>
  );
}
