"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SlideDesignConfig } from "@/types/slide";

const colorFields = [
  { key: "backgroundColor", label: "Background" },
  { key: "textColor", label: "Text" },
  { key: "accentColor", label: "Accent" },
] as const;

/** Long enough to cover a colour drag, short enough to feel immediate. */
const commitDelay = 250;

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

  /*
   * A native colour input fires while the OS picker is dragged, and a range
   * fires on every tick. Passing each one straight up restarted the editor's
   * autosave timer dozens of times a second. The control stays live locally and
   * the draft hears about it once the drag settles.
   */
  const [local, setLocal] = useState(design);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sent = useRef(JSON.stringify(design));
  const notify = useRef(onChange);
  notify.current = onChange;

  const incoming = JSON.stringify(design);

  // Adopt the parent's value when it changed for some other reason, such as
  // switching slides or undoing, but never when it is only echoing us back.
  useEffect(() => {
    if (incoming === sent.current) return;
    sent.current = incoming;
    setLocal(design);
  }, [incoming, design]);

  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);

  function update(next: SlideDesignConfig) {
    setLocal(next);

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      sent.current = JSON.stringify(next);
      notify.current(next);
    }, commitDelay);
  }

  const overridden = Object.keys(local).length > 0;

  return (
    <div className="grid gap-4">
      {colorFields.map(({ key, label }) => (
        <div key={key} className="grid gap-1.5">
          <Label htmlFor={key}>{label}</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id={key}
              aria-label={`${label} color picker`}
              value={local[key] ?? defaults[key]}
              onChange={(event) => update({ ...local, [key]: event.target.value })}
              className="size-10 shrink-0 cursor-pointer rounded-md border bg-transparent p-1"
            />
            <Input
              value={local[key] ?? ""}
              placeholder={defaults[key]}
              spellCheck={false}
              onChange={(event) => {
                const next = { ...local };
                if (event.target.value) next[key] = event.target.value;
                else delete next[key];
                update(next);
              }}
            />
          </div>
        </div>
      ))}

      <div className="grid gap-1.5">
        <Label htmlFor="fontScale">
          Text size: {Math.round((local.fontScale ?? 1) * 100)}% of the Brand Kit
        </Label>
        <Input
          id="fontScale"
          type="range"
          min={0.6}
          max={1.6}
          step={0.05}
          value={local.fontScale ?? 1}
          onChange={(event) => update({ ...local, fontScale: Number(event.target.value) })}
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
              variant={(local.align ?? "left") === option ? "default" : "outline"}
              onClick={() => update({ ...local, align: option })}
            >
              {option === "left" ? "Left" : "Center"}
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
          onClick={() => update({})}
        >
          Reset to the Brand Kit
        </Button>
      )}
    </div>
  );
}
