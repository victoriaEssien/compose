import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">There is nothing here</h1>
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
