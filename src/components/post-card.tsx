import Image from "next/image";
import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { postTypeLabels } from "@/types/post";
import type { PostWithCover } from "@/server/posts";

const dateFormat = new Intl.DateTimeFormat("en", { day: "numeric", month: "short" });

/**
 * The cover slide, not just the title. Whether a grid of posts looks like one
 * account is a visual judgment (spec section 5), and it cannot be made from a
 * list of text rows. The card is white on the page's paper so the work reads as
 * a print on a desk, and it rises a little under the pointer.
 */
export function PostCard({ post }: { post: PostWithCover }) {
  return (
    <Link
      href={`/posts/${post.id}`}
      className="group bg-card shadow-card hover:shadow-lift focus-visible:ring-ring block overflow-hidden rounded-xl border transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div className="bg-muted relative aspect-[4/5] overflow-hidden">
        {post.coverSlideId ? (
          /*
            The optimizer fetches the source itself, server to server, with no
            session cookie, so this route answered it 401 and every cover on the
            dashboard came back broken. Unoptimized makes the browser fetch it,
            which is also what we want: the route already renders at the exact
            size and sets its own private cache header.
          */
          <Image
            src={`/api/posts/${post.id}/slides/${post.coverSlideId}/png`}
            alt=""
            unoptimized
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
            No cover yet
          </div>
        )}

        <div className="absolute top-2.5 left-2.5">
          <StatusBadge status={post.status} className="shadow-card backdrop-blur-sm" />
        </div>
      </div>

      <div className="p-3.5">
        <p className="line-clamp-2 text-sm leading-snug font-medium text-pretty">{post.title}</p>
        <p className="text-muted-foreground mt-1.5 text-xs" data-numeric>
          {postTypeLabels[post.type]} · {dateFormat.format(post.updatedAt)}
        </p>
      </div>
    </Link>
  );
}
