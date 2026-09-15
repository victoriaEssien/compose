import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { requireUserId } from "@/server/auth";

/** Guards every signed-in page. Full app navigation lands here in Phase 3. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUserId();

  return (
    <div className="min-h-dvh">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/dashboard" className="font-semibold">
            Compose
          </Link>
          <SignOutButton />
        </div>
      </header>
      {children}
    </div>
  );
}
