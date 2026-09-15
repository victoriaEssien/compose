import { notFound } from "next/navigation";

import { requireUserId } from "@/server/auth";
import { loadPost } from "@/server/posts";
import type { SlideSpec } from "@/types/slide";

const statusLabels = { draft: "Draft", ready: "Ready", exported: "Exported" } as const;

/** Plain text stand-in until the renderer lands (Phase 6). */
function summarize(content: SlideSpec): { primary: string; secondary: string | null } {
  switch (content.template) {
    case "cover":
      return { primary: content.headline, secondary: content.subheadline };
    case "text":
      return { primary: content.heading, secondary: content.body };
    case "numbered_list":
      return {
        primary: content.heading ?? "Numbered list",
        secondary: content.items.map((item) => item.title).join(" / "),
      };
    case "code":
      return { primary: content.heading ?? content.language, secondary: content.explanation };
    case "comparison":
      return {
        primary: content.heading ?? `${content.left.label} vs ${content.right.label}`,
        secondary: `${content.left.body} / ${content.right.body}`,
      };
    case "quote":
      return { primary: content.quote, secondary: content.attribution };
    case "screenshot":
      return { primary: content.heading ?? "Screenshot", secondary: content.caption };
    case "project":
      return { primary: content.name, secondary: content.description };
    case "final":
      return { primary: content.heading, secondary: content.cta };
  }
}

export default async function Page({ params }: { params: Promise<{ postId: string }> }) {
  const userId = await requireUserId();
  const { postId } = await params;
  const found = await loadPost(userId, postId);

  if (!found) notFound();

  const { post, slides } = found;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-muted-foreground text-xs">
        {statusLabels[post.status]} · {post.type.replaceAll("_", " ")} · {slides.length} slides
      </p>
      <h1 className="mt-2 text-2xl font-semibold">{post.title}</h1>

      <ol className="mt-8 flex flex-col gap-3">
        {slides.map((slide) => {
          const { primary, secondary } = summarize(slide.content);

          return (
            <li key={slide.id} className="rounded-lg border p-4">
              <p className="text-muted-foreground text-xs">
                Slide {slide.order + 1} · {slide.template.replaceAll("_", " ")}
              </p>
              <p className="mt-2 font-medium">{primary}</p>
              {secondary && <p className="text-muted-foreground mt-1 text-sm">{secondary}</p>}

              <details className="mt-3">
                <summary className="text-muted-foreground cursor-pointer text-xs">
                  Full slide data
                </summary>
                <pre className="bg-muted mt-2 overflow-x-auto rounded-md p-3 text-xs">
                  {JSON.stringify(slide.content, null, 2)}
                </pre>
              </details>
            </li>
          );
        })}
      </ol>

      <p className="text-muted-foreground mt-8 text-sm">
        Visual previews, editing and PNG export arrive with the renderer.
      </p>
    </main>
  );
}
