import { cn } from "@/lib/utils";

/**
 * One header shape for every page, so moving between them does not feel like
 * moving between products. Title left, actions right, both wrapping before
 * either truncates.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-x-6 gap-y-4", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-muted-foreground mb-1.5 text-[0.6875rem] font-medium tracking-[0.08em] uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[1.6rem] leading-tight font-semibold text-balance sm:text-[1.875rem]">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed text-pretty">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** The next level down. Used for the bands within a page. */
export function SectionHeader({
  title,
  description,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <h2 className="font-display text-base font-semibold">{title}</h2>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm text-pretty">{description}</p>
        )}
      </div>
      {actions}
    </div>
  );
}
