import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { requireUserId } from "@/server/auth";
import { listAssets } from "@/server/assets";
import { AssetList } from "./asset-list";
import { AssetUploader } from "./asset-uploader";

export const metadata = { title: "Assets" };

export default async function Page() {
  const userId = await requireUserId();
  const assets = await listAssets(userId);

  return (
    <>
      <PageHeader
        title="Assets"
        description="Screenshots, logos, avatars and illustrations you can reuse across posts."
      />

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
    </>
  );
}
