"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { templateNames } from "@/templates/names";
import type { SlideDesignConfig, TemplateKind } from "@/types/slide";

export type SavedLook = {
  id: string;
  name: string;
  kind: TemplateKind;
  configuration: SlideDesignConfig;
};

/**
 * Spec section 15: save a design that worked and use it again. This is how
 * "consistently good" becomes true across posts rather than within one, so it
 * stores the per-slide overrides, never the copy.
 */
export function SavedLooks({
  looks,
  current,
  currentKind,
  disabled,
  onApply,
  onSave,
  onDelete,
}: {
  looks: SavedLook[];
  current: SlideDesignConfig;
  currentKind: TemplateKind;
  disabled: boolean;
  onApply: (configuration: SlideDesignConfig) => void;
  onSave: (name: string, kind: TemplateKind, configuration: SlideDesignConfig) => void;
  onDelete: (id: string) => void;
}) {
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");

  const hasOverrides = Object.keys(current).length > 0;

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;

    onSave(name.trim(), currentKind, current);
    setName("");
    setNaming(false);
  }

  return (
    <div className="grid gap-3 border-t pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-display text-sm font-semibold">Saved looks</h4>
        {!naming && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || !hasOverrides}
            onClick={() => setNaming(true)}
          >
            Save this look
          </Button>
        )}
      </div>

      {!hasOverrides && !naming && (
        <p className="text-muted-foreground text-xs text-pretty">
          Change a color or the text size above, then you can save it and put the same look on
          another slide.
        </p>
      )}

      {naming && (
        <form onSubmit={save} className="grid gap-2">
          <Label htmlFor="lookName" className="text-xs">
            Call it something you will recognise
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="lookName"
              value={name}
              maxLength={40}
              placeholder="Dark quote"
              autoFocus
              onChange={(event) => setName(event.target.value)}
            />
            <Button type="submit" size="sm" disabled={disabled || !name.trim()}>
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setNaming(false);
                setName("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {looks.length > 0 && (
        <ul className="grid gap-1.5">
          {looks.map((look) => (
            <li key={look.id} className="flex items-center gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onApply(look.configuration)}
                className="hover:border-foreground/30 focus-visible:ring-ring flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
              >
                <span aria-hidden="true" className="flex shrink-0 gap-1">
                  {(["backgroundColor", "textColor", "accentColor"] as const).map((key) => (
                    <span
                      key={key}
                      className="size-3.5 rounded-full border"
                      style={{ backgroundColor: look.configuration[key] ?? "transparent" }}
                    />
                  ))}
                </span>
                <span className="truncate">{look.name}</span>
                <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                  {templateNames[look.kind]}
                </span>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Delete the look named ${look.name}`}
                disabled={disabled}
                onClick={() => onDelete(look.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
