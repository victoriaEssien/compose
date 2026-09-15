"use client";

import { useState, useTransition } from "react";

import { ImageField } from "@/components/image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { contrastRatio, readableContrast } from "@/lib/contrast";
import type { AssetRow } from "@/server/db/schema";
import type { BrandKit, BrandPreset } from "@/types/brand";
import {
  brandPresets,
  cardStyles,
  codeBlockStyles,
  fontFamilies,
  illustrationStyles,
} from "@/types/brand";
import { saveBrandKitAction } from "./actions";
import { BrandPreview } from "./brand-preview";

const labels = {
  card: { flat: "Flat", outlined: "Outlined", elevated: "Elevated", glass: "Glass" },
  illustration: { none: "None", line: "Line", flat: "Flat", isometric: "Isometric", three_d: "3D" },
  codeBlock: { dark: "Dark", light: "Light", terminal: "Terminal" },
} as const;

const colorFields = [
  { key: "background", label: "Background" },
  { key: "text", label: "Text" },
  { key: "accent", label: "Accent" },
  { key: "muted", label: "Muted" },
] as const;

/** Eleven controls in five unlabelled sections was one undifferentiated wall. */
function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card shadow-card grid gap-4 rounded-xl border p-5">
      <div>
        <h2 className="font-display text-base font-semibold">{title}</h2>
        {hint && (
          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed text-pretty">{hint}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export function BrandKitForm({
  initial,
  assets,
  postCount,
}: {
  initial: BrandKit;
  assets: AssetRow[];
  postCount: number;
}) {
  const [kit, setKit] = useState(initial);
  const [status, setStatus] = useState<{ saved: boolean; error: string | null }>({
    saved: false,
    error: null,
  });
  const [pending, startTransition] = useTransition();

  function set<K extends keyof BrandKit>(key: K, value: BrandKit[K]) {
    setKit((current) => ({ ...current, [key]: value }));
    setStatus({ saved: false, error: null });
  }

  /** A whole look at once. Identity fields and voice are the user's, so they stay. */
  function applyPreset(preset: BrandPreset) {
    setKit((current) => ({
      ...current,
      fonts: { ...preset.fonts },
      colors: { ...preset.colors },
      style: { ...preset.style },
    }));
    setStatus({ saved: false, error: null });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => setStatus(await saveBrandKitAction(kit)));
  }

  // The schema accepts any two hex codes, including a pair that renders every
  // slide invisible. Warn rather than block: it is the user's brand.
  const ratio = contrastRatio(kit.colors.text, kit.colors.background);
  const unreadable = ratio !== null && ratio < readableContrast;

  return (
    <form onSubmit={onSubmit} className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
      <div className="flex flex-col gap-5">
        <Section
          title="Identity"
          hint="Your handle is drawn in the footer of every slide, so it ends up in every exported PNG."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Brand name</Label>
              <Input
                id="name"
                value={kit.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={kit.username}
                onChange={(e) => set("username", e.target.value)}
                required
              />
            </div>
            <ImageField
              id="logoUrl"
              label="Logo"
              assets={assets}
              value={kit.logoUrl}
              onChange={(value) => set("logoUrl", value)}
            />
            <ImageField
              id="avatarUrl"
              label="Avatar"
              shape="circle"
              hint="Drawn in the footer of every slide, beside your handle."
              assets={assets}
              value={kit.avatarUrl}
              onChange={(value) => set("avatarUrl", value)}
            />
          </div>
        </Section>

        <Section title="Start from a look" hint="Sets the fonts, colors, radius and styles below.">
          <div className="grid gap-2 sm:grid-cols-2">
            {brandPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className="hover:border-foreground/30 focus-visible:ring-ring flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-md border"
                  style={{ backgroundColor: preset.colors.background }}
                >
                  <span
                    className="size-4 rounded-full"
                    style={{ backgroundColor: preset.colors.accent }}
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{preset.name}</span>
                  <span className="text-muted-foreground block text-xs text-pretty">
                    {preset.description}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Type">
          <div className="grid gap-4 sm:grid-cols-2">
            {(["primary", "secondary"] as const).map((slot) => (
              <div key={slot} className="grid gap-2">
                <Label htmlFor={slot + "Font"}>
                  {slot === "primary" ? "Primary" : "Secondary"} font
                </Label>
                <Select
                  value={kit.fonts[slot]}
                  onValueChange={(value) =>
                    set("fonts", { ...kit.fonts, [slot]: value as BrandKit["fonts"]["primary"] })
                  }
                >
                  <SelectTrigger id={slot + "Font"} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontFamilies.map((family) => (
                      <SelectItem key={family} value={family}>
                        {family}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <p className="text-muted-foreground text-xs sm:col-span-2">
              Only these fonts can be rendered into a PNG, so the list is fixed.
            </p>
          </div>
        </Section>

        <Section title="Color">
          <div className="grid gap-4 sm:grid-cols-2">
            {colorFields.map(({ key, label }) => (
              <div key={key} className="grid gap-2">
                <Label htmlFor={key}>{label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label={label + " color picker"}
                    value={kit.colors[key]}
                    onChange={(e) => set("colors", { ...kit.colors, [key]: e.target.value })}
                    className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-1"
                  />
                  <Input
                    id={key}
                    spellCheck={false}
                    aria-invalid={unreadable && (key === "text" || key === "background")}
                    aria-describedby={
                      unreadable && (key === "text" || key === "background")
                        ? "contrastWarning"
                        : undefined
                    }
                    value={kit.colors[key]}
                    onChange={(e) => set("colors", { ...kit.colors, [key]: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
          {unreadable && (
            <p id="contrastWarning" role="status" className="text-destructive text-xs text-pretty">
              Text on background is {ratio?.toFixed(1)}:1. Below {readableContrast}:1 the copy on
              your slides is hard to read, and at 1:1 it disappears.
            </p>
          )}
        </Section>

        <Section title="Shape and style">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="radius">Corner radius: {kit.style.radius}px</Label>
              <Input
                id="radius"
                type="range"
                min={0}
                max={48}
                value={kit.style.radius}
                onChange={(e) => set("style", { ...kit.style, radius: Number(e.target.value) })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cardStyle">Card style</Label>
              <Select
                value={kit.style.card}
                onValueChange={(value) =>
                  set("style", { ...kit.style, card: value as BrandKit["style"]["card"] })
                }
              >
                <SelectTrigger id="cardStyle" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cardStyles.map((value) => (
                    <SelectItem key={value} value={value}>
                      {labels.card[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="illustrationStyle">Illustration style</Label>
              <Select
                value={kit.style.illustration}
                onValueChange={(value) =>
                  set("style", {
                    ...kit.style,
                    illustration: value as BrandKit["style"]["illustration"],
                  })
                }
              >
                <SelectTrigger id="illustrationStyle" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {illustrationStyles.map((value) => (
                    <SelectItem key={value} value={value}>
                      {labels.illustration[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="codeBlockStyle">Code block style</Label>
              <Select
                value={kit.style.codeBlock}
                onValueChange={(value) =>
                  set("style", { ...kit.style, codeBlock: value as BrandKit["style"]["codeBlock"] })
                }
              >
                <SelectTrigger id="codeBlockStyle" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {codeBlockStyles.map((value) => (
                    <SelectItem key={value} value={value}>
                      {labels.codeBlock[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>

        <Section title="Voice">
          <div className="grid gap-2">
            <Label htmlFor="voice">Brand voice</Label>
            <Textarea
              id="voice"
              rows={6}
              placeholder={"Direct\nTechnical\nFunny when appropriate\nNo motivational fluff"}
              value={kit.voice ?? ""}
              onChange={(e) => set("voice", e.target.value || null)}
            />
            <p className="text-muted-foreground text-xs">
              How the AI should write your hooks, slide copy and CTAs.
            </p>
          </div>
        </Section>

        <div className="grid gap-3">
          {postCount > 0 && (
            <p className="text-muted-foreground text-xs text-pretty">
              Saving restyles {postCount === 1 ? "your 1 post" : `all ${postCount} of your posts`},
              including any you have already exported. The PNGs on your disk keep the old look.
            </p>
          )}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save Brand Kit"}
            </Button>
            <span aria-live="polite" className="text-muted-foreground text-sm">
              {status.saved ? "Saved." : ""}
            </span>
            {status.error && (
              <span role="alert" className="text-destructive text-sm">
                {status.error}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-10 lg:self-start">
        <p className="text-muted-foreground mb-3 text-[0.6875rem] font-medium tracking-[0.08em] uppercase">
          Preview
        </p>
        <BrandPreview kit={kit} />
      </div>
    </form>
  );
}
