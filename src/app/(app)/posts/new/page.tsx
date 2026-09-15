import Link from "next/link";

import { requireUserId } from "@/server/auth";
import { loadBrandKit } from "@/server/brand";
import { hasPlaceholderHandle } from "@/types/brand";
import { CreatePostForm } from "./create-post-form";

export default async function Page() {
  const userId = await requireUserId();
  const brandKit = await loadBrandKit(userId);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Create a post</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Compose reads what you paste, structures it, and plans the slides. You can edit everything
        afterwards.
      </p>

      {hasPlaceholderHandle(brandKit) && (
        <p className="mt-6 rounded-lg border border-dashed px-4 py-3 text-sm">
          Every slide is signed <span className="font-medium">{brandKit.username}</span> until you
          set your handle, and downloads stay blocked while it is a placeholder.{" "}
          <Link href="/brand" className="underline underline-offset-4">
            Set it in your Brand Kit
          </Link>
          . You can still generate this post first.
        </p>
      )}

      <div className="mt-8">
        <CreatePostForm />
      </div>
    </main>
  );
}
