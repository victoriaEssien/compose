"use client";

import { useState, useTransition } from "react";

import { AssetPicker } from "@/components/asset-picker";
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
import type { AssetRow } from "@/server/db/schema";
import type { BrandKit } from "@/types/brand";
import { cardStyles, codeBlockStyles, illustrationStyles } from "@/types/brand";
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

function AssetUrlField({
  id,
  label,
  assets,
  value,
  onChange,
}: {
  id: string;
  label: string;
  assets: AssetRow[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="url"
          placeholder="https://"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
        />
        <AssetPicker
          assets={assets}
          onSelect={(asset) => onChange(asset.url)}
          trigger={
            <Button type="button" variant="outline">
              Choose
            </Button>
          }
        />
      </div>
    </div>
  );
}

export function BrandKitForm({ initial, assets }: { initial: BrandKit; assets: AssetRow[] }) {
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

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => setStatus(await saveBrandKitAction(kit)));
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-10 lg:grid-cols-[1fr_auto]">
      <div className="flex flex-col gap-8">
        <section className="grid gap-4 sm:grid-cols-2">
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
          <AssetUrlField
            id="logoUrl"
            label="Logo"
            assets={assets}
            value={kit.logoUrl}
            onChange={(value) => set("logoUrl", value)}
          />
          <AssetUrlField
            id="avatarUrl"
            label="Avatar"
            assets={assets}
            value={kit.avatarUrl}
            onChange={(value) => set("avatarUrl", value)}
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="fontPrimary">Primary font</Label>
            <Input
              id="fontPrimary"
              value={kit.fonts.primary}
              onChange={(e) => set("fonts", { ...kit.fonts, primary: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fontSecondary">Secondary font</Label>
            <Input
              id="fontSecondary"
              value={kit.fonts.secondary}
              onChange={(e) => set("fonts", { ...kit.fonts, secondary: e.target.value })}
              required
            />
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
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
                  value={kit.colors[key]}
                  onChange={(e) => set("colors", { ...kit.colors, [key]: e.target.value })}
                />
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
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
        </section>

        <section className="grid gap-2">
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
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save Brand Kit"}
          </Button>
          {status.saved && <span className="text-muted-foreground text-sm">Saved.</span>}
          {status.error && (
            <span role="alert" className="text-destructive text-sm">
              {status.error}
            </span>
          )}
        </div>
      </div>

      <div className="lg:sticky lg:top-10 lg:self-start">
        <p className="text-muted-foreground mb-3 text-sm">Preview</p>
        <BrandPreview kit={kit} />
      </div>
    </form>
  );
}
