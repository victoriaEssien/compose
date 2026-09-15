import type { BrandKit } from "@/types/brand";

/**
 * Stand-in for the real renderer (Phase 6) so colors, fonts and radius can be
 * judged while editing. Same sample slide, same 4:5 carousel ratio.
 */
export function BrandPreview({ kit }: { kit: BrandKit }) {
  return (
    <div
      className="flex aspect-[4/5] w-full max-w-sm flex-col justify-between overflow-hidden border p-8"
      style={{
        backgroundColor: kit.colors.background,
        color: kit.colors.text,
        borderRadius: kit.style.radius,
        fontFamily: `${kit.fonts.primary}, system-ui, sans-serif`,
      }}
    >
      <span
        className="text-xs font-medium tracking-widest uppercase"
        style={{ color: kit.colors.accent }}
      >
        Things I learned
      </span>

      <p className="text-3xl leading-tight font-semibold text-balance">
        You probably don&apos;t need Redis yet
      </p>

      <div className="flex items-center gap-3">
        <span
          className="size-8 shrink-0 rounded-full"
          style={{ backgroundColor: kit.colors.accent }}
        />
        <span
          className="text-sm"
          style={{
            color: kit.colors.muted,
            fontFamily: `${kit.fonts.secondary}, system-ui, sans-serif`,
          }}
        >
          {kit.username}
        </span>
      </div>
    </div>
  );
}
