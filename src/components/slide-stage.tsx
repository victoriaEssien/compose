"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Scales a rendered slide to whatever width it is actually given, instead of a
 * hard-coded one. The slide size arrives as numbers rather than through
 * `@/templates`, which pulls the font metrics table and should not reach the
 * browser.
 */
export function SlideStage({
  children,
  slideWidth,
  slideHeight,
  maxWidth,
  className,
}: {
  children: React.ReactNode;
  slideWidth: number;
  slideHeight: number;
  maxWidth: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Before the first measurement, assume the full width it is allowed.
  const resolved = width ?? maxWidth;
  const scale = resolved / slideWidth;

  return (
    <div ref={ref} className={cn("w-full", className)} style={{ maxWidth }}>
      <div
        className="bg-muted overflow-hidden rounded-xl border"
        style={{ height: Math.round(slideHeight * scale) }}
      >
        <div
          style={{
            width: slideWidth,
            height: slideHeight,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
