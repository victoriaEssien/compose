"use client";

import { createElement, useState } from "react";

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
import { iconNodes } from "@/templates/icon-nodes";
import type { IconName } from "@/templates/icon-nodes";
import { iconNames } from "@/templates/icons";

/** The same node data the renderer draws, so the picker cannot show a different mark. */
export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {iconNodes[name].map(([tag, attrs], at) => createElement(tag, { key: at, ...attrs }))}
    </svg>
  );
}

/**
 * `resolveIcon` has a fixed vocabulary and the field used to hide it, so the only
 * way to find a mark was to guess words, with a paid image model as the fallback
 * for guessing wrong. Forty-two options is past the four-choice rule, but they
 * are recognised at a glance rather than held in memory.
 */
export function IconPicker({
  value,
  disabled,
  onSelect,
}: {
  value: IconName | null;
  disabled: boolean;
  onSelect: (name: string | null) => void;
}) {
  const [open, setOpen] = useState(false);

  function choose(name: IconName | null) {
    onSelect(name);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={disabled}>
          {value ? <Icon name={value} className="size-4" /> : null}
          {value ? value : "Choose an icon"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose an icon</DialogTitle>
          <DialogDescription>
            These are bundled, so they are free and instant. Anything else needs a generated
            illustration.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[55vh] grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
          <button
            type="button"
            onClick={() => choose(null)}
            aria-pressed={value === null}
            className={cn(
              "hover:bg-accent focus-visible:ring-ring flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border text-[10px] focus-visible:ring-2 focus-visible:outline-none",
              value === null && "border-foreground",
            )}
          >
            None
          </button>

          {iconNames.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => choose(name)}
              aria-pressed={value === name}
              title={name}
              className={cn(
                "hover:bg-accent focus-visible:ring-ring flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border focus-visible:ring-2 focus-visible:outline-none",
                value === name && "border-foreground",
              )}
            >
              <Icon name={name} className="size-5" />
              <span className="text-muted-foreground max-w-full truncate px-1 text-[10px]">
                {name}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
