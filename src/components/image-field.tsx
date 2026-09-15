"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useState } from "react";

import { AssetPicker } from "@/components/asset-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { AssetRow } from "@/server/db/schema";

/**
 * An image field that shows the image.
 *
 * This used to be a bare url input, so picking a logo from the asset library
 * filled the box with 90 characters of Blob URL and no picture: the one thing
 * the field exists to confirm was the one thing it would not show. The URL is
 * still reachable, because pasting one is a legitimate way to set this, but it
 * is behind a disclosure rather than in your face.
 */
export function ImageField({
  id,
  label,
  hint,
  assets,
  value,
  shape = "square",
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  assets: AssetRow[];
  value: string | null;
  /** A round well for an avatar, a square one for a logo. */
  shape?: "square" | "circle";
  onChange: (value: string | null) => void;
}) {
  const [showUrl, setShowUrl] = useState(false);
  const [broken, setBroken] = useState(false);

  const well = cn(
    "bg-muted relative flex size-16 shrink-0 items-center justify-center overflow-hidden border",
    shape === "circle" ? "rounded-full" : "rounded-lg",
  );

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>

      <div className="flex items-center gap-3">
        <div className={well}>
          {value && !broken ? (
            /* Arbitrary Blob URLs at 64px: the optimizer round trip costs more
               than it saves, and it cannot reach a host it does not know. */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt=""
              onError={() => setBroken(true)}
              onLoad={() => setBroken(false)}
              className="size-full object-contain"
            />
          ) : (
            <ImagePlus
              className={cn("size-5", broken ? "text-destructive" : "text-muted-foreground")}
              aria-hidden="true"
            />
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <AssetPicker
              assets={assets}
              onSelect={(asset) => {
                setBroken(false);
                onChange(asset.url);
              }}
              trigger={
                <Button type="button" variant="outline" size="sm" id={id}>
                  {value ? "Replace" : "Choose"}
                </Button>
              }
            />
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBroken(false);
                  onChange(null);
                }}
              >
                <Trash2 className="size-3.5" />
                Remove
              </Button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowUrl((open) => !open)}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring w-fit cursor-pointer rounded-sm text-left text-xs underline underline-offset-2 focus-visible:ring-2 focus-visible:outline-none"
          >
            {showUrl ? "Hide URL" : "Or paste a URL"}
          </button>
        </div>
      </div>

      {broken && value && (
        <p role="status" className="text-destructive text-xs text-pretty">
          That URL did not load as an image. It may have been deleted from your assets.
        </p>
      )}

      {hint && !broken && <p className="text-muted-foreground text-xs text-pretty">{hint}</p>}

      {showUrl && (
        <Input
          type="url"
          aria-label={`${label} URL`}
          placeholder="https://"
          value={value ?? ""}
          spellCheck={false}
          onChange={(event) => {
            setBroken(false);
            onChange(event.target.value || null);
          }}
        />
      )}
    </div>
  );
}
