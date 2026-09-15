import { Link2 } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { requireUserId } from "@/server/auth";
import { loadBrandKit } from "@/server/brand";
import { hasPlaceholderHandle } from "@/types/brand";
import { CreatePostForm } from "./create-post-form";

export const metadata = { title: "New post" };

export default async function Page() {
  const userId = await requireUserId();
  const brandKit = await loadBrandKit(userId);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="New post"
        description="Compose reads what you paste, structures it, and plans the slides. You can edit everything afterwards."
      />

      {hasPlaceholderHandle(brandKit) && (
        <p className="border-draft/30 bg-draft-surface text-foreground mt-6 flex gap-2.5 rounded-xl border px-4 py-3 text-sm text-pretty">
          <Link2 className="text-draft mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Every slide is signed <span className="font-medium">{brandKit.username}</span> until you
            set your handle, and downloads stay blocked while it is a placeholder.{" "}
            <Link href="/brand" className="text-primary font-medium underline underline-offset-4">
              Set it in your Brand Kit
            </Link>
            . You can still generate this post first.
          </span>
        </p>
      )}

      <div className="mt-8">
        <CreatePostForm />
      </div>
    </div>
  );
}
