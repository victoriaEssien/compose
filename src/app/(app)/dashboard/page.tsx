import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { requireUserId } from "@/server/auth";
import { loadBrandKit } from "@/server/brand";
import { listDrafts, listRecentPosts, postMetrics } from "@/server/posts";
import { isDefaultBrandKit } from "@/types/brand";

/** Spec section 34 wants this tracked, and spec section 21 wants no analytics panel. */
function metricsLine({
  generated,
  exported,
  medianMsToExport,
}: {
  generated: number;
  exported: number;
  medianMsToExport: number | null;
}) {
  if (generated === 0) return null;

  const parts = [`${exported} of ${generated} posts exported`];

  if (medianMsToExport !== null) {
    const minutes = Math.floor(medianMsToExport / 60000);
    const seconds = Math.round((medianMsToExport % 60000) / 1000);
    parts.push(`typically ${minutes}m ${seconds}s from idea to export`);
  }

  return parts.join(", ");
}

export default async function Page() {
  const userId = await requireUserId();
  const [recent, drafts, brandKit, metrics] = await Promise.all([
    listRecentPosts(userId),
    listDrafts(userId),
    loadBrandKit(userId),
    postMetrics(userId),
  ]);

  const summary = metricsLine(metrics);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Your Content</h1>
          {summary && <p className="text-muted-foreground mt-1 text-xs">{summary}</p>}
        </div>
        <Button asChild>
          <Link href="/posts/new">Create Post</Link>
        </Button>
      </div>

      {drafts.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-medium">Drafts</h2>
          <p className="text-muted-foreground mt-1 text-xs">Pick up where you left off.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {drafts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-sm font-medium">Recent Posts</h2>
        {recent.length ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="mt-3">
            <EmptyState
              title={drafts.length ? "Nothing finished yet" : "No posts yet"}
              description={
                drafts.length
                  ? "Posts show up here once you mark them ready or download them."
                  : "Paste a rough idea, a project update or something you learned, and Compose will turn it into a carousel."
              }
              action={
                drafts.length ? undefined : { href: "/posts/new", label: "Create your first post" }
              }
            />
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium">Brand Kit</h2>
        {isDefaultBrandKit(brandKit) ? (
          <div className="mt-3">
            <EmptyState
              title="Your Brand Kit is not set up"
              description="Fonts, colors and voice live here. Every post Compose generates follows them."
              action={{ href: "/brand", label: "Set up your Brand Kit" }}
            />
          </div>
        ) : (
          <Link
            href="/brand"
            className="hover:border-foreground/20 mt-3 flex items-center gap-4 rounded-lg border p-4 transition-colors"
          >
            <div className="flex gap-1.5">
              {[brandKit.colors.background, brandKit.colors.text, brandKit.colors.accent].map(
                (color) => (
                  <span
                    key={color}
                    className="size-6 rounded-full border"
                    style={{ backgroundColor: color }}
                  />
                ),
              )}
            </div>
            <div>
              <p className="font-medium">{brandKit.name}</p>
              <p className="text-muted-foreground text-xs">
                {brandKit.username} · {brandKit.fonts.primary}
              </p>
            </div>
          </Link>
        )}
      </section>
    </main>
  );
}
