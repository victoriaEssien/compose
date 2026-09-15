import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";

import { cn } from "@/lib/utils";
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
  //
  // Keyed because an array of elements handed to a client component is
  // serialised as a list, and a template returns its root element without one.
  // The editor draws these one at a time, so the warning was about a list that
  // never renders as one, but the fix is the same either way.
  const rendered = await Promise.all(
    inputs.map((input) => slideElement(input, brand, format, inputs.length, assetUrls)),
  );
  const elements = rendered.map((element, at) => (
    <Fragment key={slides[at].id}>{element}</Fragment>
  ));

  const size = formatSizes[format];

  // Checking the square crop on slide 5 used to drop you back on slide 1.
  const requested = Number(query.slide);
  const startAt =
    Number.isInteger(requested) && requested >= 1 && requested <= slides.length ? requested - 1 : 0;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-5">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1 rounded-sm text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <ChevronLeft className="size-4" />
          Posts
        </Link>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[0.6875rem] font-medium tracking-[0.08em] uppercase">
            {postTypeLabels[post.type]} · {slides.length} slides
          </p>
          <h1 className="font-display mt-2 text-[1.6rem] leading-tight font-semibold wrap-break-word sm:text-[1.875rem]">
            {post.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PostStatusSelect postId={post.id} status={post.status} />
          {/* Two states of one setting, so they read as one control. */}
          <div className="bg-muted flex items-center gap-0.5 rounded-lg p-0.5">
            {(["carousel", "square"] as const).map((option) => (
              <Link
                key={option}
                href={`/posts/${post.id}?format=${option}&slide=${startAt + 1}`}
                aria-current={option === format ? "true" : undefined}
                aria-label={
                  option === "carousel"
                    ? "Carousel format, 1080 by 1350"
                    : "Square format, 1080 by 1080"
                }
                className={cn(
                  "focus-visible:ring-ring flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  option === format
                    ? "bg-card text-foreground shadow-card font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option === "carousel" ? "Carousel" : "Square"}
                <span className="text-[0.625rem] opacity-60" data-numeric>
                  {option === "carousel" ? "4:5" : "1:1"}
                </span>
              </Link>
            ))}
          </div>
          <ExportPanel
            postId={post.id}
            format={format}
            slideCount={slides.length}
            width={size.width}
            height={size.height}
          />
        </div>
      </div>

      <div className="mt-8">
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
    </>
  );
}
