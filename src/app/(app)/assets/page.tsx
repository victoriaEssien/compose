import { EmptyState } from "@/components/empty-state";
import { requireUserId } from "@/server/auth";
import { listAssets } from "@/server/assets";
import { AssetList } from "./asset-list";
import { AssetUploader } from "./asset-uploader";

export default async function Page() {
  const userId = await requireUserId();
  const assets = await listAssets(userId);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">My Assets</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Screenshots, logos, avatars and illustrations you can reuse across posts.
      </p>

      <div className="mt-8">
        <AssetUploader />
      </div>

      <div className="mt-8">
        {assets.length ? (
          <AssetList assets={assets} />
        ) : (
          <EmptyState
            title="No assets yet"
            description="Upload a screenshot or a logo and it will be available in every post you create."
          />
        )}
      </div>
    </main>
  );
}
