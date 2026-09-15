import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { requireUser } from "@/server/auth";
import { loadBrandKit } from "@/server/brand";
import { brandFontUrls } from "@/server/render/fonts";
import { isDefaultBrandKit } from "@/types/brand";

/** Guards every signed-in page and wraps it in the workspace shell. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const brand = await loadBrandKit(user.id);

  return (
    <>
      {/*
        globals.css declares ten @font-face rules, and a browser only fetches one
        once a glyph needs it, which is after CSS parse and layout. These two are
        the ones every preview on the page will want.
      */}
      {brandFontUrls(brand).map((href) => (
        <link key={href} rel="preload" as="font" type="font/ttf" href={href} crossOrigin="" />
      ))}

      <AppShell
        user={{ name: user.name, email: user.email, image: user.image ?? null }}
        brand={{
          name: brand.name,
          username: brand.username,
          swatches: [brand.colors.background, brand.colors.accent, brand.colors.text],
          configured: !isDefaultBrandKit(brand),
        }}
      >
        {children}
      </AppShell>
      <Toaster />
    </>
  );
}
