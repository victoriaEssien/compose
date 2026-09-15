import { Plus } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader, SectionHeader } from "@/components/page-header";
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
  const firstRun = isDefaultBrandKit(brandKit) && recent.length === 0 && drafts.length === 0;

  return (
    <>
      <PageHeader
        title="Posts"
        description={summary ?? "Everything you have made, newest first."}
        actions={
          <Button asChild variant={firstRun ? "outline" : "default"}>
            <Link href="/posts/new">
              <Plus className="size-4" />
              New post
            </Link>
          </Button>
        }
      />

      {/*
        On a brand new account both calls to action are empty states, and nothing
        said which came first. The Brand Kit does: it signs every slide.
      */}
      {firstRun && (
        <section className="mt-8">
          <EmptyState
            title="Set up your Brand Kit first"
            description="Fonts, colours and voice live here, and every post Compose generates follows them. It takes a minute, and it is what makes your posts look like yours."
            action={{ href: "/brand", label: "Set up your Brand Kit" }}
            primary
          />
        </section>
      )}

      {drafts.length > 0 && (
        <section className="mt-10">
          <SectionHeader title="Drafts" description="Pick up where you left off." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {drafts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <SectionHeader title={drafts.length > 0 ? "Everything else" : "Recent posts"} />
        {recent.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recent.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={drafts.length ? "Nothing finished yet" : "No posts yet"}
            description={
              drafts.length
                ? "Posts show up here once you mark them ready or download them."
                : "Paste a rough idea, a project update or something you learned, and Compose will turn it into a carousel. There is an example on the New post screen if you want to watch it work first."
            }
            action={drafts.length ? undefined : { href: "/posts/new", label: "Create your first post" }}
            primary={!firstRun && drafts.length === 0}
            visual={drafts.length === 0}
          />
        )}
      </section>
    </>
  );
}
