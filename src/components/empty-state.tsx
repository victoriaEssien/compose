import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** A ghosted 4:5 carousel, so an empty page still shows what it is for. */
function SlideGhost() {
  return (
    <div aria-hidden="true" className="mb-6 flex items-end justify-center gap-2.5">
      {[0, 1, 2].map((at) => (
        <div
          key={at}
          className="border-muted-foreground/25 bg-card/60 aspect-[4/5] w-12 rounded-lg border border-dashed"
          style={{ opacity: 1 - at * 0.3, transform: `translateY(${at * 3}px)` }}
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
  className,
}: {
  title: string;
  description: string;
  action?: { href: string; label: string };
  /** Draws the call to action as the page's main next step rather than an aside. */
  primary?: boolean;
  visual?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed px-6 py-12 text-center",
        primary ? "border-primary/25 bg-primary/[0.035]" : "bg-card/50",
        className,
      )}
    >
      {visual && <SlideGhost />}
      <p className="font-display text-base font-semibold">{title}</p>
      <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm leading-relaxed text-pretty">
        {description}
      </p>
      {action && (
        <Button
          asChild
          variant={primary ? "default" : "outline"}
          size={primary ? "default" : "sm"}
          className="mt-6"
        >
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
