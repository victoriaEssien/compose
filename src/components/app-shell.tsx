"use client";

import { Menu, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { AppNav } from "@/components/app-nav";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import type { SessionUser } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export type BrandSummary = {
  name: string;
  username: string;
  swatches: string[];
  configured: boolean;
};

/**
 * What your brand currently looks like, which the nav link alone cannot say.
 * Before it is set up this is the only prompt in the shell, and it is loud on
 * purpose: a slide signed "@yourhandle" is a slide you cannot post.
 */
function BrandChip({ brand, onNavigate }: { brand: BrandSummary; onNavigate?: () => void }) {
  if (!brand.configured) {
    return (
      <Link
        href="/brand"
        onClick={onNavigate}
        className="border-primary/25 bg-primary/5 hover:bg-primary/10 focus-visible:ring-ring block rounded-lg border border-dashed p-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <span className="text-primary flex items-center gap-1.5 text-xs font-medium">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Set up your Brand Kit
        </span>
        <span className="text-muted-foreground mt-1 block text-xs leading-snug text-pretty">
          Fonts, colours and your handle. It signs every slide.
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/brand"
      onClick={onNavigate}
      className="hover:bg-accent/60 focus-visible:ring-ring flex items-center gap-2.5 rounded-lg p-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span aria-hidden="true" className="flex shrink-0 -space-x-1.5">
        {brand.swatches.map((color) => (
          <span
            key={color}
            className="ring-sidebar size-5 rounded-full ring-2"
            style={{ backgroundColor: color }}
          />
        ))}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium">{brand.name}</span>
        <span className="text-muted-foreground block truncate text-xs">{brand.username}</span>
      </span>
    </Link>
  );
}

function SidebarBody({ user, brand, onNavigate }: {
  user: SessionUser;
  brand: BrandSummary;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="px-3 pt-4 pb-3">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="focus-visible:ring-ring inline-flex rounded-md px-1 py-1 focus-visible:ring-2 focus-visible:outline-none"
        >
          <Logo />
          <span className="sr-only">Compose home</span>
        </Link>
      </div>

      <div className="px-3 pb-4">
        <Button asChild className="w-full justify-start gap-2">
          <Link href="/posts/new" onClick={onNavigate}>
            <Plus className="size-4" />
            New post
          </Link>
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3">
        <p className="text-muted-foreground px-2.5 pb-1.5 text-[0.6875rem] font-medium tracking-[0.08em] uppercase">
          Workspace
        </p>
        <AppNav onNavigate={onNavigate} />
      </div>

      <div className="border-sidebar-border grid gap-1 border-t p-3">
        <BrandChip brand={brand} onNavigate={onNavigate} />
        <UserMenu user={user} />
      </div>
    </>
  );
}

export function AppShell({
  user,
  brand,
  children,
}: {
  user: SessionUser;
  brand: BrandSummary;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // A drawer that survives the navigation it just triggered covers the page you
  // asked for. Closing on href change also covers the browser back button.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      {/* First thing in the tab order, so keyboard users can skip the nav. */}
      <a
        href="#main"
        className="bg-card focus-visible:ring-ring sr-only rounded-md border px-4 py-2 text-sm focus-visible:not-sr-only focus-visible:absolute focus-visible:top-3 focus-visible:left-3 focus-visible:z-50 focus-visible:ring-2"
      >
        Skip to content
      </a>

      <aside className="bg-sidebar border-sidebar-border sticky top-0 hidden h-dvh flex-col border-r lg:flex">
        <SidebarBody user={user} brand={brand} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="bg-sidebar/85 border-sidebar-border sticky top-0 z-30 flex items-center gap-2 border-b px-3 py-2.5 backdrop-blur-md lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pt-1">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarBody user={user} brand={brand} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <Link href="/dashboard" className="focus-visible:ring-ring rounded-md focus-visible:ring-2 focus-visible:outline-none">
            <Logo />
            <span className="sr-only">Compose home</span>
          </Link>

          <Button asChild size="sm" className="ml-auto gap-1.5">
            <Link href="/posts/new">
              <Plus className="size-4" />
              New post
            </Link>
          </Button>
        </header>

        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
