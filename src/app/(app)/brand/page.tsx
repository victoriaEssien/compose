import { requireUserId } from "@/server/auth";
import { loadBrandKit } from "@/server/brand";
import { BrandKitForm } from "./brand-kit-form";

export default async function Page() {
  const userId = await requireUserId();
  const kit = await loadBrandKit(userId);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Brand Kit</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Every post Compose generates follows these.
      </p>

      <div className="mt-10">
        <BrandKitForm initial={kit} />
      </div>
    </main>
  );
}
