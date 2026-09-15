import Image from "next/image";
import Link from "next/link";

import type { PostWithCover } from "@/server/posts";

const statusLabels = {
  draft: "Draft",
  ready: "Ready",
  exported: "Exported",
} as const;

const dateFormat = new Intl.DateTimeFormat("en", { day: "numeric", month: "short" });

/**
 * The cover slide, not just the title. Whether a grid of posts looks like one
 * account is a visual judgment (spec section 5), and it cannot be made from a
 * list of text rows.
 */
export function PostCard({ post }: { post: PostWithCover }) {
  return (
    <Link
      href={`/posts/${post.id}`}
      className="hover:border-foreground/20 group block overflow-hidden rounded-lg border transition-colors"
    >
      {post.coverSlideId ? (
        <div className="bg-muted relative aspect-[4/5]">
          {/*
            The optimizer fetches the source itself, server to server, with no
            session cookie, so this route answered it 401 and every cover on the
            dashboard came back broken. Unoptimized makes the browser fetch it,
            which is also what we want: the route already renders at the exact
            size and sets its own private cache header.
          */}
          <Image
            src={`/api/posts/${post.id}/slides/${post.coverSlideId}/png`}
            alt=""
            unoptimized
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="bg-muted aspect-[4/5]" />
      )}

      <div className="p-4">
        <p className="line-clamp-2 font-medium">{post.title}</p>
        <p className="text-muted-foreground mt-2 text-xs">
          {statusLabels[post.status]} · {dateFormat.format(post.updatedAt)}
        </p>
      </div>
    </Link>
  );
}
