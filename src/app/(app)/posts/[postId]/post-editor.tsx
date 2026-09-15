"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { AssetPicker } from "@/components/asset-picker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SlideStage } from "@/components/slide-stage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { resolveIcon } from "@/templates/icons";
import { templateNames } from "@/templates/names";
import { regenerateActions } from "@/types/slide";
import type { RegenerateAction, SlideDesignConfig, SlideSpec, TemplateKind } from "@/types/slide";
import {
  changeTemplateAction,
  deleteSlideAction,
  duplicateSlideAction,
  generateIllustrationAction,
  regenerateSlideAction,
  removeIllustrationAction,
  reorderSlideAction,
  restoreSlideAction,
  moveSlideAction,
  saveSlideAction,
} from "./actions";
import { draftFor, draftSignature, serverSignature, shouldAutosave } from "./editor-state";
import type { EditableSlide, SlideDraft } from "./editor-state";
import { IconPicker } from "./icon-picker";
import { SlideDesign } from "./slide-design";
import { SlideFields } from "./slide-fields";
import { SlideFilmstrip } from "./slide-filmstrip";
import { TemplatePicker } from "./template-picker";

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

/** Each action names itself, so one button's progress never labels another's. */
const runningLabels: Record<string, string> = {
  move: "Reordering...",
  duplicate: "Duplicating...",
  delete: "Deleting...",
  restore: "Restoring...",
  template: "Changing template...",
  regenerate: "Regenerating...",
  illustration: "Generating illustration...",
  unillustrate: "Removing illustration...",
  undo: "Undoing...",
};

const autosaveDelay = 900;

export function PostEditor({
  postId,
  slides,
  previews,
  thumbs,
  slideWidth,
  slideHeight,
  assets,
  brandColors,
  format,
}: {
  postId: string;
  slides: EditableSlide[];
  /** The rendered slides. Same elements as `thumbs`, drawn at a different scale. */
  previews: React.ReactNode[];
  thumbs: React.ReactNode[];
  slideWidth: number;
  slideHeight: number;
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
  const [saveFailed, setSaveFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [regenerateWith, setRegenerateWith] = useState<RegenerateAction>("rewrite");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const draft = editing.content;
  const design = editing.design;

  const fromServer = serverSignature(slide);
  const synced = useRef(fromServer);

  // flushPending runs from event handlers, which cannot read render-scoped state.
  const editingRef = useRef(editing);
  editingRef.current = editing;
  const slidesRef = useRef(slides);
  slidesRef.current = slides;

  // Adopt server state only when it differs from what this editor last sent,
  // so a refresh mid-edit cannot overwrite what is being typed.
  useEffect(() => {
    if (fromServer === synced.current && editing.id === slide.id) return;
    synced.current = fromServer;
    setEditing(draftFor(slide));
  }, [fromServer, slide, editing.id]);

  /**
   * Writes the draft now instead of waiting out the debounce. Anything that
   * moves off the current slide, or reads it on the server, calls this first.
   * Returns false when the write failed, which is the caller's cue to stay put
   * rather than continue and lose the text.
   */
  const flushPending = useCallback(async () => {
    const pending = editingRef.current;
    const owner = slidesRef.current.find((row) => row.id === pending.id);
    if (!owner || !shouldAutosave(pending, owner)) return true;

    setStatus("Saving");
    const result = await saveSlideAction(postId, pending.id, pending.content, pending.design);

    if (!result.ok) {
      setStatus("Not saved");
      setSaveFailed(true);
      setError(result.error);
      return false;
    }

    synced.current = draftSignature(pending);
    setSaveFailed(false);
    setError(null);
    setStatus("Saved");
    return true;
  }, [postId]);

  // Autosave: the draft is the truth while typing, the server catches up after a pause.
  useEffect(() => {
    if (!shouldAutosave(editing, slide)) return;

    const timer = setTimeout(async () => {
      if (await flushPending()) router.refresh();
    }, autosaveDelay);

    return () => clearTimeout(timer);
  }, [editing, slide, flushPending, router]);

  // Closing the tab inside the debounce window would drop the last keystrokes.
  const dirty = shouldAutosave(editing, slide);
  useEffect(() => {
    if (!dirty && !saveFailed) return;

    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saveFailed]);

  function setDraft(content: SlideSpec) {
    setEditing((current) => ({ ...current, content }));
  }

  function setDesign(design: SlideDesignConfig) {
    setEditing((current) => ({ ...current, design }));
  }

  function run(
    label: string,
    work: () => Promise<{ ok: boolean; error: string | null }>,
    onDone?: () => void,
  ) {
    startTransition(async () => {
      setRunning(label);

      // Every action below reads the slide from the database. Without this the
      // text still sitting in the debounce would be silently overwritten.
      if (await flushPending()) {
        const result = await work();
        setError(result.error);
        if (result.ok) {
          onDone?.();
          router.refresh();
        }
      }

      setRunning(null);
    });
  }

  function retrySave() {
    startTransition(async () => {
      if (await flushPending()) router.refresh();
    });
  }

  /** Undo for anything that replaced this slide's content: write the old copy back. */
  function undoTo(slideId: string, previous: SlideDraft) {
    return () =>
      run("undo", () => saveSlideAction(postId, slideId, previous.content, previous.design));
  }

  function selectSlide(at: number) {
    if (at === index) return;

    const pending = editingRef.current;
    const owner = slidesRef.current.find((row) => row.id === pending.id);
    if (!owner || !shouldAutosave(pending, owner)) {
      setActive(at);
      return;
    }

    // Dirty, so the switch waits on the write and is abandoned if it fails.
    startTransition(async () => {
      if (await flushPending()) setActive(at);
    });
  }

  /** Reorders the post. The arrows beside the preview only change what you are looking at. */
  function move(direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;

    run(
      "move",
      () => moveSlideAction(postId, slide.id, direction),
      () => setActive(target),
    );
  }

  /** Dropping a thumbnail elsewhere in the filmstrip. */
  function reorder(from: number, to: number) {
    const moved = slides[from];
    if (!moved) return;

    run(
      "move",
      () => reorderSlideAction(postId, moved.id, to),
      () => setActive(to),
    );
  }

  function changeTemplate(value: TemplateKind) {
    const previous = editingRef.current;

    run(
      "template",
      () => changeTemplateAction(postId, slide.id, value),
      () => {
        toast(`Template changed to ${templateNames[value]}.`, {
          description: "Fields that do not exist on the new template were dropped.",
          action: { label: "Undo", onClick: undoTo(previous.id, previous) },
        });
      },
    );
  }

  function deleteSlide() {
    const snapshot = editingRef.current;
    const at = index;
    const imageUrl = slide.imageUrl;

    setConfirmingDelete(false);
    run(
      "delete",
      () => deleteSlideAction(postId, slide.id),
      () => {
        setActive(Math.max(0, at - 1));
        toast(`Slide ${at + 1} deleted.`, {
          action: {
            label: "Undo",
            onClick: () =>
              run(
                "restore",
                () => restoreSlideAction(postId, at, snapshot.content, snapshot.design, imageUrl),
                () => setActive(at),
              ),
          },
        });
      },
    );
  }

  function regenerate() {
    const previous = editingRef.current;

    run(
      "regenerate",
      () => regenerateSlideAction(postId, slide.id, regenerateWith, instruction || null),
      () => {
        toast("Slide rewritten.", {
          action: { label: "Undo", onClick: undoTo(previous.id, previous) },
        });
      },
    );
  }

  const canTakeAsset = draft.template === "screenshot" || draft.template === "project";
  const matchedIcon = resolveIcon(draft.visual);
  const visualHelp = slide.imageUrl
    ? "Showing a generated illustration."
    : matchedIcon
      ? `Showing the ${matchedIcon} icon.`
      : "No icon matches this hint. Generate an illustration, or try another word.";

  return (
    <div className="grid gap-10 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)] md:gap-8 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:gap-10">
      <div className="flex flex-col items-center gap-5 md:sticky md:top-6 md:self-start">
        <SlideFilmstrip
          slides={slides}
          thumbs={thumbs}
          index={index}
          slideWidth={slideWidth}
          slideHeight={slideHeight}
          disabled={busy}
          onSelect={selectSlide}
          onReorder={reorder}
        />

        <div className="flex w-full items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="View the previous slide"
            disabled={index === 0}
            onClick={() => selectSlide(index - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                aria-label={`Open slide ${index + 1} at full size`}
                className="focus-visible:ring-ring min-w-0 flex-1 cursor-zoom-in rounded-xl focus-visible:ring-2 focus-visible:outline-none"
              >
                {previews.map((preview, at) => (
                  <SlideStage
                    key={slides[at]?.id ?? at}
                    slideWidth={slideWidth}
                    slideHeight={slideHeight}
                    maxWidth={440}
                    className={cn("mx-auto", at !== index && "hidden")}
                  >
                    {preview}
                  </SlideStage>
                ))}
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[min(92vw,640px)]">
              <DialogHeader>
                <DialogTitle>
                  Slide {index + 1} of {slides.length}
                </DialogTitle>
              </DialogHeader>
              <SlideStage
                slideWidth={slideWidth}
                slideHeight={slideHeight}
                maxWidth={592}
                className="mx-auto"
              >
                {previews[index]}
              </SlideStage>
            </DialogContent>
          </Dialog>

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="View the next slide"
            disabled={index === slides.length - 1}
            onClick={() => selectSlide(index + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label="Reorder: move this slide earlier in the post"
            disabled={busy || index === 0}
            onClick={() => move(-1)}
          >
            Move earlier
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Reorder: move this slide later in the post"
            disabled={busy || index === slides.length - 1}
            onClick={() => move(1)}
          >
            Move later
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => run("duplicate", () => duplicateSlideAction(postId, slide.id))}
          >
            Duplicate
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={busy || slides.length === 1}
            onClick={() => setConfirmingDelete(true)}
          >
            Delete
          </Button>
          <Button asChild variant="outline" size="sm">
            <a
              href={`/api/posts/${postId}/slides/${slide.id}/png?format=${format}&download=1`}
              download
            >
              Download
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-medium">Slide {index + 1}</h2>
          <span
            aria-live="polite"
            className={cn("text-xs", saveFailed ? "text-destructive" : "text-muted-foreground")}
          >
            {running ? (runningLabels[running] ?? "Working...") : (status ?? "")}
          </span>
        </div>

        {error && (
          <div className="flex flex-wrap items-center gap-3">
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
            {saveFailed && (
              <Button variant="outline" size="sm" disabled={busy} onClick={retrySave}>
                Try saving again
              </Button>
            )}
          </div>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="template">Layout</Label>
          <TemplatePicker
            value={draft.template}
            format={format}
            disabled={busy}
            onSelect={changeTemplate}
          />
        </div>

        <SlideFields slide={draft} onChange={setDraft} />

        <div className="grid gap-2">
          <Label htmlFor="visual">Visual</Label>
          <div className="flex flex-wrap items-center gap-2">
            <IconPicker
              value={matchedIcon}
              disabled={busy}
              onSelect={(name) => setDraft({ ...draft, visual: name })}
            />
            <Input
              id="visual"
              className="min-w-40 flex-1"
              value={draft.visual ?? ""}
              placeholder="Or describe one: a hand-drawn query plan"
              onChange={(event) => setDraft({ ...draft, visual: event.target.value || null })}
            />
          </div>
          <p className="text-muted-foreground text-xs">{visualHelp}</p>

          {(!matchedIcon || slide.imageUrl) && (
            <div className="mt-1 grid gap-2 rounded-lg border border-dashed p-3">
              <p className="text-muted-foreground text-xs">
                An illustration is drawn by an image model. It costs money and takes a few seconds,
                so Compose never does it on its own.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy || !draft.visual}
                  onClick={() =>
                    run("illustration", () => generateIllustrationAction(postId, slide.id))
                  }
                >
                  {running === "illustration"
                    ? "Generating..."
                    : slide.imageUrl
                      ? "Generate another"
                      : "Generate an illustration"}
                </Button>
                {slide.imageUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      run("unillustrate", () => removeIllustrationAction(postId, slide.id))
                    }
                  >
                    Remove illustration
                  </Button>
                )}
              </div>
            </div>
          )}
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
          <h3 className="text-sm font-medium">Regenerate this slide</h3>

          <Label htmlFor="regenerateWith" className="sr-only">
            What to change
          </Label>
          <Select
            value={regenerateWith}
            onValueChange={(value) => setRegenerateWith(value as RegenerateAction)}
          >
            <SelectTrigger id="regenerateWith" className="w-full">
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
            aria-label="Extra regeneration instruction"
            value={instruction}
            placeholder="Optional. Make this slide less wordy."
            onChange={(event) => setInstruction(event.target.value)}
          />

          <Button type="button" disabled={busy} onClick={regenerate}>
            {running === "regenerate" ? "Regenerating..." : "Regenerate"}
          </Button>

          <p className="text-muted-foreground text-xs">
            This replaces the text on this slide. The rest of the post stays as it is, and you can
            undo it.
          </p>
        </div>
      </div>

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete slide {index + 1}, the {templateNames[draft.template].toLowerCase()} slide?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The post drops to {slides.length - 1} slides. You can undo this straight after.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSlide}>Delete slide</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
