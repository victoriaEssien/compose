import Link from "next/link";

import type { PostRow } from "@/server/db/schema";

const statusLabels = {
  draft: "Draft",
  ready: "Ready",
  exported: "Exported",
} as const;

const dateFormat = new Intl.DateTimeFormat("en", { day: "numeric", month: "short" });

export function PostCard({ post }: { post: PostRow }) {
  return (
    <Link
      href={`/posts/${post.id}`}
      className="hover:border-foreground/20 block rounded-lg border p-5 transition-colors"
    >
      <p className="line-clamp-2 font-medium">{post.title}</p>
      <p className="text-muted-foreground mt-2 text-xs">
        {statusLabels[post.status]} · {dateFormat.format(post.updatedAt)}
      </p>
    </Link>
  );
}
