import Link from "next/link";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <Logo className="mb-2" />
      <h1 className="font-display text-2xl font-semibold text-balance">There is nothing here</h1>
      <p className="text-muted-foreground text-sm text-pretty">
        That post may have been deleted, or the link may belong to another account.
      </p>
      <div>
        <Button asChild>
          <Link href="/dashboard">Go to your posts</Link>
        </Button>
      </div>
    </main>
  );
}
