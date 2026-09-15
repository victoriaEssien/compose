import { cn } from "@/lib/utils";

/**
 * One shape for every block on this page: what it is on the left, the controls
 * on the right, and the save action on its own footer rail so a long form never
 * hides its own button.
 */
export function SettingsCard({
  title,
  description,
  footer,
  children,
  className,
}: {
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("bg-card shadow-card overflow-hidden rounded-xl border", className)}>
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-8">
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold">{title}</h2>
          {description && (
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed text-pretty">
              {description}
            </p>
          )}
        </div>
        {children && <div className="min-w-0">{children}</div>}
      </div>
      {footer && (
        <div className="bg-muted/50 flex flex-wrap items-center justify-end gap-3 border-t px-5 py-3 sm:px-6">
          {footer}
        </div>
      )}
    </section>
  );
}
