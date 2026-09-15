import Link from "next/link";

import { Button } from "@/components/ui/button";

/** A ghosted 4:5 carousel, so an empty page still shows what it is for. */
function SlideGhost() {
  return (
    <div aria-hidden="true" className="mb-5 flex items-end justify-center gap-2">
      {[0, 1, 2].map((at) => (
        <div
          key={at}
          className="border-muted-foreground/25 aspect-[4/5] w-10 rounded-md border border-dashed"
          style={{ opacity: 1 - at * 0.28 }}
        />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  primary = false,
  visual = false,
}: {
  title: string;
  description: string;
  action?: { href: string; label: string };
  /** Draws the call to action as the page's main next step rather than an aside. */
  primary?: boolean;
  visual?: boolean;
}) {
  return (
    <div className="rounded-lg border border-dashed px-6 py-10 text-center">
      {visual && <SlideGhost />}
      <p className="font-medium">{title}</p>
      <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm text-pretty">
        {description}
      </p>
      {action && (
        <Button
          asChild
          variant={primary ? "default" : "outline"}
          size={primary ? "default" : "sm"}
          className="mt-5"
        >
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
