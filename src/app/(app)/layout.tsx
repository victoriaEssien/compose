import Link from "next/link";

import { AppNav } from "@/components/app-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";
import { requireUserId } from "@/server/auth";

/** Guards every signed-in page. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUserId();

  return (
    <div className="min-h-dvh">
      {/* First thing in the tab order, so keyboard users can skip the nav. */}
      <a
        href="#main"
        className="bg-background focus-visible:ring-ring sr-only rounded-md border px-4 py-2 text-sm focus-visible:not-sr-only focus-visible:absolute focus-visible:top-3 focus-visible:left-3 focus-visible:z-50 focus-visible:ring-2"
      >
        Skip to content
      </a>

      <header className="border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
          <Link href="/dashboard" className="font-semibold">
            Compose
          </Link>
          <AppNav />
          <div className="ml-auto flex items-center gap-1">
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
