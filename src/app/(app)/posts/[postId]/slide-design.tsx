"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SlideDesignConfig } from "@/types/slide";

const colorFields = [
  { key: "backgroundColor", label: "Background" },
  { key: "textColor", label: "Text" },
  { key: "accentColor", label: "Accent" },
] as const;

export function SlideDesign({
  design,
  fallback,
  onChange,
}: {
  design: SlideDesignConfig;
  fallback: { background: string; text: string; accent: string };
  onChange: (next: SlideDesignConfig) => void;
}) {
  const defaults = {
    backgroundColor: fallback.background,
    textColor: fallback.text,
    accentColor: fallback.accent,
  } as const;

  const overridden = Object.keys(design).length > 0;

  return (
    <div className="grid gap-4">
      {colorFields.map(({ key, label }) => (
        <div key={key} className="grid gap-1.5">
          <Label htmlFor={key}>{label}</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id={key}
              aria-label={`${label} colour`}
              value={design[key] ?? defaults[key]}
              onChange={(event) => onChange({ ...design, [key]: event.target.value })}
              className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-1"
            />
            <Input
              value={design[key] ?? ""}
              placeholder={defaults[key]}
              spellCheck={false}
              onChange={(event) => {
                const next = { ...design };
                if (event.target.value) next[key] = event.target.value;
                else delete next[key];
                onChange(next);
              }}
            />
          </div>
        </div>
      ))}

      <div className="grid gap-1.5">
        <Label htmlFor="fontScale">
          Text size: {Math.round((design.fontScale ?? 1) * 100)}% of the Brand Kit
        </Label>
        <Input
          id="fontScale"
          type="range"
          min={0.6}
          max={1.6}
          step={0.05}
          value={design.fontScale ?? 1}
          onChange={(event) => onChange({ ...design, fontScale: Number(event.target.value) })}
        />
      </div>

      <div className="grid gap-1.5">
        <Label>Alignment</Label>
        <div className="flex gap-2">
          {(["left", "center"] as const).map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={(design.align ?? "left") === option ? "default" : "outline"}
              onClick={() => onChange({ ...design, align: option })}
            >
              {option === "left" ? "Left" : "Centre"}
            </Button>
          ))}
        </div>
      </div>

      {overridden && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-self-start"
          onClick={() => onChange({})}
        >
          Reset to the Brand Kit
        </Button>
      )}
    </div>
  );
}
