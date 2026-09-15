"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { brandKitSchema } from "@/types/brand";
import type { BrandKit } from "@/types/brand";

/**
 * The real renderer, not a stand-in.
 *
 * This used to be hand-written Tailwind, so card style, illustration style, code
 * block style, the logo and the secondary font's role in the footer produced no
 * feedback at all: six of eleven controls were adjusted blind. These three are
 * drawn by the same code that draws the exported PNG.
 */
const shown = [
  { kind: "cover", caption: "Cover" },
  { kind: "numbered_list", caption: "List, card style" },
  { kind: "code", caption: "Code block style" },
] as const;

const settleDelay = 400;

export function BrandPreview({ kit }: { kit: BrandKit }) {
  // Renders are server work, so wait for typing to stop, and never send a kit
  // the schema would reject: a half-typed hex would just fall back anyway.
  const [settled, setSettled] = useState<BrandKit>(kit);

  useEffect(() => {
    const parsed = brandKitSchema.safeParse(kit);
    if (!parsed.success) return;

    const timer = setTimeout(() => setSettled(parsed.data), settleDelay);
    return () => clearTimeout(timer);
  }, [kit]);

  const query = encodeURIComponent(JSON.stringify(settled));

  return (
    <div className="grid grid-cols-3 gap-3 lg:w-[19rem] lg:grid-cols-2">
      {shown.map(({ kind, caption }, at) => (
        <figure key={kind} className={at === 0 ? "lg:col-span-2" : undefined}>
          <div className="bg-muted relative aspect-[4/5] overflow-hidden rounded-lg border">
            <Image
              // Unoptimized: the kit changes on every edit, so an optimizer
              // entry per keystroke would be pure waste.
              unoptimized
              src={`/api/templates/${kind}/png?format=carousel&kit=${query}`}
              alt={`${caption} sample slide in your Brand Kit`}
              fill
              sizes="(max-width: 1024px) 33vw, 160px"
              className="object-cover"
            />
          </div>
          <figcaption className="text-muted-foreground mt-1.5 text-[11px]">{caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}
