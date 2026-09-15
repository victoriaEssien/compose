import Link from "next/link";

import { AppNav } from "@/components/app-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";
import { requireUserId } from "@/server/auth";
import { loadBrandKit } from "@/server/brand";
import { brandFontUrls } from "@/server/render/fonts";

/** Guards every signed-in page. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = await requireUserId();
  const brand = await loadBrandKit(userId);

  return (
    <div className="min-h-dvh">
      {/*
        globals.css declares ten @font-face rules, and a browser only fetches one
        once a glyph needs it, which is after CSS parse and layout. These two are
        the ones every preview on the page will want.
      */}
      {brandFontUrls(brand).map((href) => (
        <link key={href} rel="preload" as="font" type="font/ttf" href={href} crossOrigin="" />
      ))}

      {/* First thing in the tab order, so keyboard users can skip the nav. */}
      <a
        href="#main"
        className="bg-background focus-visible:ring-ring sr-only rounded-md border px-4 py-2 text-sm focus-visible:not-sr-only focus-visible:absolute focus-visible:top-3 focus-visible:left-3 focus-visible:z-50 focus-visible:ring-2"
      >
        Skip to content
      </a>

      <header className="border-b">
        {/*
          Four links plus the wordmark and the account controls do not fit 342px,
          and wrapping produced two or three ragged rows. On phones the nav gets
          its own scrollable row instead; from sm up it is one row as before.
        */}
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-3 sm:flex-row sm:items-center sm:gap-x-6">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="font-semibold">
              Compose
            </Link>
            <div className="ml-auto flex items-center gap-1 sm:hidden">
              <ThemeToggle />
              <SignOutButton />
            </div>
          </div>

          <AppNav />

          <div className="ml-auto hidden items-center gap-1 sm:flex">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>
      <div id="main">{children}</div>
      <Toaster />
    </div>
  );
}
