import Link from "next/link";

import { AppNav } from "@/components/app-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { Toaster } from "@/components/ui/sonner";
import { requireUserId } from "@/server/auth";

/** Guards every signed-in page. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUserId();

  return (
    <div className="min-h-dvh">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
          <Link href="/dashboard" className="font-semibold">
            Compose
          </Link>
          <AppNav />
          <div className="ml-auto">
            <SignOutButton />
          </div>
        </div>
      </header>
      {children}
      <Toaster />
    </div>
  );
}
