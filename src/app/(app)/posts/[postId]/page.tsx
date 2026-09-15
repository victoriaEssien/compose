import Link from "next/link";
import { notFound } from "next/navigation";

import { SlidePreview } from "@/components/slide-preview";
import { Button } from "@/components/ui/button";
import { requireUserId } from "@/server/auth";
import { loadRenderablePost, parseFormat } from "@/server/render/post";
import { templates } from "@/templates";
import { SlideCarousel } from "./slide-carousel";

const statusLabels = { draft: "Draft", ready: "Ready", exported: "Exported" } as const;
const previewWidth = 380;

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ format?: string }>;
}) {
  const userId = await requireUserId();
  const { postId } = await params;
  const found = await loadRenderablePost(userId, postId);

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
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs">
            {statusLabels[post.status]} · {post.type.replaceAll("_", " ")} · {slides.length} slides
          </p>
          <h1 className="mt-2 text-2xl font-semibold">{post.title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {(["carousel", "square"] as const).map((option) => (
            <Button
              key={option}
              asChild
              size="sm"
              variant={option === format ? "default" : "outline"}
            >
              <Link href={`/posts/${post.id}?format=${option}`}>
                {option === "carousel" ? "4:5" : "1:1"}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <SlideCarousel
          previews={previews}
          labels={slides.map((slide) => templates[slide.template].name)}
          downloadUrls={slides.map(
            (slide) => `/api/posts/${post.id}/slides/${slide.id}/png?format=${format}`,
          )}
        />
      </div>

      <div className="mt-10 flex justify-center">
        <Button asChild>
          <a href={`/api/posts/${post.id}/export?format=${format}`} download>
            Download all {slides.length} slides
          </a>
        </Button>
      </div>

      <p className="text-muted-foreground mt-10 text-center text-sm">
        Editing and regeneration arrive next.
      </p>
    </main>
  );
}
