import { cn } from "@/lib/utils";

/** Two letters at most: a long name shrinks to nothing at 32px otherwise. */
export function initialsOf(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

/**
 * Initials on a tinted disc unless there is a picture. Deliberately not
 * next/image: these are Blob URLs of unknown size and the disc is 32px, so the
 * optimizer round trip costs more than it saves.
 */
export function Avatar({
  name,
  email,
  image,
  className,
}: {
  name: string;
  email: string;
  image?: string | null;
  className?: string;
}) {
  const base = "size-8 shrink-0 overflow-hidden rounded-full";

  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" className={cn(base, "object-cover", className)} />;
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        base,
        "bg-primary/10 text-primary font-display flex items-center justify-center text-[0.6875rem] font-semibold",
        className,
      )}
    >
      {initialsOf(name, email)}
    </span>
  );
}
