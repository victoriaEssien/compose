import { cn } from "@/lib/utils";
import type { PostStatus } from "@/types/post";

/**
 * Draft, ready and exported are the three states a post moves through, and on a
 * grid of covers the label is the only thing that says which. Each pairing was
 * measured: the dimmest is 4.8:1 on its own tint.
 */
const styles: Record<PostStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-draft-surface text-draft" },
  ready: { label: "Ready", className: "bg-ready-surface text-ready" },
  exported: { label: "Exported", className: "bg-exported-surface text-exported" },
};

export function StatusBadge({ status, className }: { status: PostStatus; className?: string }) {
  const style = styles[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-medium",
        style.className,
        className,
      )}
    >
      {style.label}
    </span>
  );
}
