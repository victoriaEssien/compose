import Link from "next/link";
import { notFound } from "next/navigation";

import { SlidePreview } from "@/components/slide-preview";
import { Button } from "@/components/ui/button";
import { listAssets } from "@/server/assets";
import { requireUserId } from "@/server/auth";
import { loadRenderablePost, parseFormat } from "@/server/render/post";
import { PostEditor } from "./post-editor";
import { PostStatusSelect } from "./post-status";

// 320 plus the page gutters still fits a 400px screen without sideways scroll.
const previewWidth = 320;

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

  const previews = await Promise.all(
    inputs.map((input) => (
      <SlidePreview
        key={input.index}
        input={input}
        brand={brand}
        format={format}
        total={inputs.length}
        assetUrls={assetUrls}
        width={previewWidth}
      />
    )),
  );

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
          }))}
          previews={previews}
        />
      </div>
    </main>
  );
}
