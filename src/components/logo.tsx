import { cn } from "@/lib/utils";

/**
 * Two slides, fanned. The product turns one idea into a sequence, and the mark
 * says exactly that. Line-work only, so it survives at 16px in a browser tab and
 * at 64px on the landing page, and it inherits currentColor so the same file
 * works on paper, on ink and inside a filled tile.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={cn("size-6", className)}
      strokeLinejoin="round"
    >
      {/* The one behind, rotated just enough to read as a stack rather than a shadow. */}
      <rect
        x="4"
        y="7"
        width="12.5"
        height="16"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity="0.34"
        transform="rotate(-9 10.25 15)"
      />
      <rect
        x="11.5"
        y="5"
        width="12.5"
        height="16"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      {/* A headline and a line under it: the slide has something on it. */}
      <rect x="14.6" y="9.1" width="6.8" height="1.9" rx="0.95" fill="currentColor" />
      <rect
        x="14.6"
        y="12.6"
        width="4.2"
        height="1.9"
        rx="0.95"
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  );
}

/** The mark and the name, locked up. Used in the sidebar, on auth and on the landing page. */
export function Logo({
  className,
  markClassName,
  showName = true,
}: {
  className?: string;
  markClassName?: string;
  showName?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={cn("text-primary size-6 shrink-0", markClassName)} />
      {showName && <span className="font-display text-[0.975rem] font-semibold">Compose</span>}
    </span>
  );
}
