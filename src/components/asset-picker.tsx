"use client";

import Image from "next/image";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { AssetRow } from "@/server/db/schema";

/** Shared by the Assets page and the slide editor (Phase 7). */
export function AssetPicker({
  assets,
  trigger,
  onSelect,
}: {
  assets: AssetRow[];
  trigger: React.ReactNode;
  onSelect: (asset: AssetRow) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose an asset</DialogTitle>
        </DialogHeader>

        {assets.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No assets yet. Upload one on the Assets page.
          </p>
        ) : (
          <ul className="grid max-h-[60vh] gap-3 overflow-y-auto sm:grid-cols-3">
            {assets.map((asset) => (
              <li key={asset.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(asset);
                    setOpen(false);
                  }}
                  className="hover:border-foreground/30 w-full overflow-hidden rounded-lg border text-left transition-colors"
                >
                  <div className="bg-muted relative aspect-[4/3]">
                    <Image
                      src={asset.url}
                      alt={asset.name}
                      fill
                      sizes="33vw"
                      className="object-contain"
                    />
                  </div>
                  <p className="truncate p-2 text-xs">{asset.name}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
