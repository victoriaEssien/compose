import { PageHeader } from "@/components/page-header";
import { listAssets } from "@/server/assets";
import { requireUserId } from "@/server/auth";
import { loadBrandKit } from "@/server/brand";
import { postMetrics } from "@/server/posts";
import { BrandKitForm } from "./brand-kit-form";

export const metadata = { title: "Brand Kit" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const userId = await requireUserId();
  const [{ welcome }, kit, assets, metrics] = await Promise.all([
    searchParams,
    loadBrandKit(userId),
    listAssets(userId),
    postMetrics(userId),
  ]);

  return (
    <>
      <PageHeader
        eyebrow={welcome ? "First things first" : undefined}
        title={welcome ? "Welcome to Compose" : "Brand Kit"}
        description={
          welcome
            ? "Start here. Your handle is drawn on every slide and these fonts and colours shape every post, so a minute spent here is what makes the rest look like you."
            : "Every post Compose generates follows these."
        }
      />

      <div className="mt-8">
        <BrandKitForm initial={kit} assets={assets} postCount={metrics.generated} />
      </div>
    </>
  );
}
