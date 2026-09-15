"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { templateNames } from "@/templates/names";
import type { EditableSlide } from "./editor-state";

const thumbWidth = 56;

/**
 * The post as a sequence, which is what a carousel actually is. Replaces a row
 * of numerals: you can see the arc, and drag a slide to a new position rather
 * than stepping it one place per round trip.
 *
 * Dragging is an accelerator, never the only way. Move earlier and Move later
 * stay in the editor for keyboard and screen reader use.
 */
export function SlideFilmstrip({
  slides,
  thumbs,
  index,
  slideWidth,
  slideHeight,
  disabled,
  onSelect,
  onReorder,
}: {
  slides: EditableSlide[];
  thumbs: React.ReactNode[];
  index: number;
  slideWidth: number;
  slideHeight: number;
  disabled: boolean;
  onSelect: (at: number) => void;
  onReorder: (from: number, to: number) => void;
}) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const scale = thumbWidth / slideWidth;

  function drop(at: number) {
    if (dragging !== null && dragging !== at) onReorder(dragging, at);
    setDragging(null);
    setOver(null);
  }

  return (
    <ol className="flex max-w-full flex-wrap items-end justify-center gap-2">
      {slides.map((row, at) => (
        <li key={row.id}>
          <button
            type="button"
            draggable={!disabled && slides.length > 1}
            onClick={() => onSelect(at)}
            onDragStart={() => setDragging(at)}
            onDragEnd={() => {
              setDragging(null);
              setOver(null);
            }}
            onDragOver={(event) => {
              if (dragging === null) return;
              event.preventDefault();
              setOver(at);
            }}
            onDrop={(event) => {
              event.preventDefault();
              drop(at);
            }}
            aria-label={`Slide ${at + 1}, ${templateNames[row.template].toLowerCase()}`}
            aria-current={at === index ? "true" : undefined}
            title={`Slide ${at + 1}: ${templateNames[row.template]}`}
            className={cn(
              "focus-visible:ring-ring block cursor-pointer rounded-md p-1 transition-[opacity,box-shadow] focus-visible:ring-2 focus-visible:outline-none",
              at === index ? "ring-foreground ring-2" : "opacity-60 hover:opacity-100",
              dragging === at && "opacity-30",
              over === at && dragging !== at && "ring-muted-foreground ring-2",
            )}
          >
            <span
              className="block overflow-hidden rounded-sm border"
              style={{ width: thumbWidth, height: Math.round(slideHeight * scale) }}
            >
              <span
                className="block"
                style={{
                  width: slideWidth,
                  height: slideHeight,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                {thumbs[at]}
              </span>
            </span>
            <span className="text-muted-foreground mt-1 block text-center text-[10px] tabular-nums">
              {at + 1}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}
