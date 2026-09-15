"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

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
import { cn } from "@/lib/utils";
import type { AssetRow } from "@/server/db/schema";
import { resolveIcon, templateList } from "@/templates";
import { regenerateActions, templateKinds } from "@/types/slide";
import type { RegenerateAction, SlideDesignConfig, SlideSpec, TemplateKind } from "@/types/slide";
import {
  changeTemplateAction,
  deleteSlideAction,
  duplicateSlideAction,
  generateIllustrationAction,
  regenerateSlideAction,
  removeIllustrationAction,
  reorderSlidesAction,
  saveSlideAction,
} from "./actions";
import { draftFor, draftSignature, serverSignature, shouldAutosave } from "./editor-state";
import type { EditableSlide, SlideDraft } from "./editor-state";
import { SlideDesign } from "./slide-design";
import { SlideFields } from "./slide-fields";

export type { EditableSlide };

const regenerateLabels: Record<RegenerateAction, string> = {
  rewrite: "Rewrite",
  shorter: "Make shorter",
  clearer: "Make clearer",
  funnier: "Make funnier",
  more_technical: "More technical",
  change_layout: "Change layout",
  another_design: "Another design",
};

const autosaveDelay = 900;

export function PostEditor({
  postId,
  slides,
  previews,
  assets,
  brandColors,
  format,
}: {
  postId: string;
  slides: EditableSlide[];
  previews: React.ReactNode[];
  assets: AssetRow[];
  brandColors: { background: string; text: string; accent: string };
  format: string;
}) {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const index = Math.min(active, slides.length - 1);
  const slide = slides[index];

  // The draft carries the id of the slide it belongs to, so a save can never
  // land on a different slide than the one it was typed into.
  const [editing, setEditing] = useState<SlideDraft>(() => draftFor(slide));
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [regenerateWith, setRegenerateWith] = useState<RegenerateAction>("rewrite");
  const [busy, startTransition] = useTransition();

  const draft = editing.content;
  const design = editing.design;

  const fromServer = serverSignature(slide);
  const synced = useRef(fromServer);

  // Adopt server state only when it differs from what this editor last sent,
  // so a refresh mid-edit cannot overwrite what is being typed.
  useEffect(() => {
    if (fromServer === synced.current && editing.id === slide.id) return;
    synced.current = fromServer;
    setEditing(draftFor(slide));
  }, [fromServer, slide, editing.id]);

  // Autosave: the draft is the truth while typing, the server catches up after a pause.
  useEffect(() => {
    if (!shouldAutosave(editing, slide)) return;

    const timer = setTimeout(async () => {
      setStatus("Saving");
      const result = await saveSlideAction(postId, editing.id, editing.content, editing.design);

      if (!result.ok) {
        setStatus(null);
        setError(result.error);
        return;
      }

      synced.current = draftSignature(editing);
      setError(null);
      setStatus("Saved");
      router.refresh();
    }, autosaveDelay);

    return () => clearTimeout(timer);
  }, [editing, postId, slide, router]);

  function setDraft(content: SlideSpec) {
    setEditing((current) => ({ ...current, content }));
  }

  function setDesign(design: SlideDesignConfig) {
    setEditing((current) => ({ ...current, design }));
  }

  function run(work: () => Promise<{ ok: boolean; error: string | null }>) {
    startTransition(async () => {
      const result = await work();
      setError(result.error);
      if (result.ok) {
        setStatus(null);
        router.refresh();
      }
    });
  }

  function move(direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;

    const order = slides.map((row) => row.id);
    [order[index], order[target]] = [order[target], order[index]];

    setActive(target);
    run(() => reorderSlidesAction(postId, order));
  }

  const canTakeAsset = draft.template === "screenshot" || draft.template === "project";
  const matchedIcon = resolveIcon(draft.visual);
  const visualHelp = slide.imageUrl
    ? "Showing a generated illustration."
    : matchedIcon
      ? `Showing the ${matchedIcon} icon.`
      : "No icon matches this hint. Generate an illustration, or try another word.";

  return (
    <div className="grid gap-10 lg:grid-cols-[420px_1fr]">
      <div className="flex flex-col items-center gap-5">
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {slides.map((row, at) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setActive(at)}
              aria-label={`Slide ${at + 1}`}
              aria-current={at === index ? "true" : undefined}
              className={cn(
                "focus-visible:ring-ring rounded-md px-2.5 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none",
                at === index
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {at + 1}
            </button>
          ))}
        </div>

        {previews.map((preview, at) => (
          <div key={slides[at]?.id ?? at} hidden={at !== index}>
            {preview}
          </div>
        ))}

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label="Move this slide earlier"
            disabled={index === 0}
            onClick={() => move(-1)}
          >
            &larr; Move
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Move this slide later"
            disabled={index === slides.length - 1}
            onClick={() => move(1)}
          >
            Move &rarr;
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => run(() => duplicateSlideAction(postId, slide.id))}
          >
            Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy || slides.length === 1}
            onClick={() => run(() => deleteSlideAction(postId, slide.id))}
          >
            Delete
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={`/api/posts/${postId}/slides/${slide.id}/png?format=${format}`} download>
              Download
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-medium">Slide {index + 1}</h2>
          <span aria-live="polite" className="text-muted-foreground text-xs">
            {busy ? "Working" : (status ?? "")}
          </span>
        </div>

        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="template">Template</Label>
          <Select
            value={draft.template}
            onValueChange={(value) =>
              run(() => changeTemplateAction(postId, slide.id, value as TemplateKind))
            }
          >
            <SelectTrigger id="template" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {templateKinds.map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {templateList.find((entry) => entry.id === kind)?.name ?? kind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <SlideFields slide={draft} onChange={setDraft} />

        <div className="grid gap-1.5">
          <Label htmlFor="visual">Visual hint</Label>
          <Input
            id="visual"
            value={draft.visual ?? ""}
            placeholder="database_icon"
            onChange={(event) => setDraft({ ...draft, visual: event.target.value || null })}
          />
          <p className="text-muted-foreground text-xs">{visualHelp}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy || !draft.visual}
              onClick={() => run(() => generateIllustrationAction(postId, slide.id))}
            >
              {busy ? "Working..." : "Generate illustration"}
            </Button>
            {slide.imageUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => run(() => removeIllustrationAction(postId, slide.id))}
              >
                Remove illustration
              </Button>
            )}
          </div>
        </div>

        {canTakeAsset && (
          <div className="flex items-center gap-2">
            <AssetPicker
              assets={assets}
              onSelect={(asset) => setDraft({ ...draft, assetId: asset.id })}
              trigger={
                <Button type="button" variant="outline" size="sm">
                  {draft.assetId ? "Change image" : "Choose image"}
                </Button>
              }
            />
            {draft.assetId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDraft({ ...draft, assetId: null })}
              >
                Remove image
              </Button>
            )}
          </div>
        )}

        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer text-sm font-medium">This slide&apos;s design</summary>
          <div className="mt-4">
            <SlideDesign design={design} fallback={brandColors} onChange={setDesign} />
          </div>
        </details>

        <div className="grid gap-3 rounded-lg border p-4">
          <p className="text-sm font-medium">Regenerate this slide</p>

          <Select
            value={regenerateWith}
            onValueChange={(value) => setRegenerateWith(value as RegenerateAction)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {regenerateActions.map((option) => (
                <SelectItem key={option} value={option}>
                  {regenerateLabels[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={instruction}
            placeholder="Optional. Make this slide less wordy."
            onChange={(event) => setInstruction(event.target.value)}
          />

          <Button
            type="button"
            disabled={busy}
            onClick={() =>
              run(() =>
                regenerateSlideAction(postId, slide.id, regenerateWith, instruction || null),
              )
            }
          >
            {busy ? "Regenerating..." : "Regenerate"}
          </Button>

          <p className="text-muted-foreground text-xs">
            Only this slide changes. The rest of the post stays as it is.
          </p>
        </div>
      </div>
    </div>
  );
}
