"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { templateNames } from "@/templates/names";
import { templateKinds } from "@/types/slide";
import type { TemplateKind } from "@/types/slide";

/**
 * Recognition instead of recall. The nine sample slides are rendered by the real
 * renderer in the user's own brand, so what you click is what you get, and they
 * only load once the dialog is opened.
 */
export function TemplatePicker({
  value,
  format,
  disabled,
  onSelect,
}: {
  value: TemplateKind;
  format: string;
  disabled: boolean;
  onSelect: (kind: TemplateKind) => void;
}) {
  const [open, setOpen] = useState(false);

  function choose(kind: TemplateKind) {
    setOpen(false);
    if (kind !== value) onSelect(kind);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {templateNames[value]}
          <span className="text-muted-foreground text-xs">Change</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose a layout</DialogTitle>
          <DialogDescription>
            Shown in your Brand Kit. Text that the new layout has no room for is dropped, and you
            can undo straight after.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
          {templateKinds.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => choose(kind)}
              aria-pressed={kind === value}
              className={cn(
                "focus-visible:ring-ring cursor-pointer rounded-lg border p-1.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none",
                kind === value ? "border-foreground" : "hover:border-foreground/30",
              )}
            >
              <span className="bg-muted relative block aspect-[4/5] overflow-hidden rounded-sm">
                {/* Cookie-authed route, so it cannot go through the optimizer. */}
                <Image
                  src={`/api/templates/${kind}/png?format=${format}`}
                  alt=""
                  unoptimized
                  fill
                  sizes="(max-width: 640px) 50vw, 220px"
                  className="object-cover"
                />
              </span>
              <span className="mt-1.5 block px-0.5 text-xs font-medium">{templateNames[kind]}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
