import { listAssets } from "@/server/assets";
import { requireUserId } from "@/server/auth";
import { loadBrandKit } from "@/server/brand";
import { BrandKitForm } from "./brand-kit-form";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const userId = await requireUserId();
  const [{ welcome }, kit, assets] = await Promise.all([
    searchParams,
    loadBrandKit(userId),
    listAssets(userId),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">{welcome ? "Welcome to Compose" : "Brand Kit"}</h1>
      <p className="text-muted-foreground mt-2 max-w-xl text-sm text-pretty">
        {welcome
          ? "Start here. Your handle is drawn on every slide and these fonts and colors shape every post, so a minute spent here is what makes the rest look like you."
          : "Every post Compose generates follows these."}
      </p>

      <div className="mt-10">
        <BrandKitForm initial={kit} assets={assets} />
      </div>
    </main>
  );
}
