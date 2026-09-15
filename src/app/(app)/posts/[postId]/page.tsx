import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { listAssets } from "@/server/assets";
import { listSavedDesigns } from "@/server/designs";
import { requireUserId } from "@/server/auth";
import { loadRenderablePost, parseFormat } from "@/server/render/post";
import { slideElement } from "@/server/render/slide";
import { formatSizes } from "@/templates";
import { postTypeLabels } from "@/types/post";
import { ExportPanel } from "./export-panel";
import { PostEditor } from "./post-editor";
import { PostStatusSelect } from "./post-status";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ format?: string; slide?: string }>;
}) {
  const userId = await requireUserId();
  const { postId } = await params;
  const [found, assets, looks] = await Promise.all([
    loadRenderablePost(userId, postId),
    listAssets(userId),
    listSavedDesigns(userId),
  ]);

  if (!found) notFound();

  const query = await searchParams;
  const format = parseFormat(query.format ?? null);
  const { post, slides, inputs, brand, assetUrls } = found;

  // Rendered once per slide, then drawn twice at different scales: once in the
  // filmstrip and once on the stage. Elements are reusable, so the expensive
  // part (Shiki, asset lookup) does not run a second time.
  const elements = await Promise.all(
    inputs.map((input) => slideElement(input, brand, format, inputs.length, assetUrls)),
  );

  const size = formatSizes[format];

  // Checking the square crop on slide 5 used to drop you back on slide 1.
  const requested = Number(query.slide);
  const startAt =
    Number.isInteger(requested) && requested >= 1 && requested <= slides.length ? requested - 1 : 0;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-sm text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <ChevronLeft className="size-4" />
          Your content
        </Link>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs">
            {postTypeLabels[post.type]} · {slides.length} slides
          </p>
          <h1 className="mt-2 text-2xl font-semibold break-words">{post.title}</h1>
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
                href={`/posts/${post.id}?format=${option}&slide=${startAt + 1}`}
                aria-label={
                  option === "carousel"
                    ? "Carousel format, 1080 by 1350"
                    : "Square format, 1080 by 1080"
                }
              >
                {option === "carousel" ? "Carousel" : "Square"}
                <span className="text-[10px] opacity-60">
                  {option === "carousel" ? "4:5" : "1:1"}
                </span>
              </Link>
            </Button>
          ))}
          <ExportPanel
            postId={post.id}
            format={format}
            slideCount={slides.length}
            width={size.width}
            height={size.height}
          />
        </div>
      </div>

      <div className="mt-10">
        <PostEditor
          postId={post.id}
          format={format}
          assets={assets}
          looks={looks.map((look) => ({
            id: look.id,
            name: look.name,
            kind: look.kind,
            configuration: look.configuration,
          }))}
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
          startAt={startAt}
          slideWidth={size.width}
          slideHeight={size.height}
        />
      </div>
    </main>
  );
}
