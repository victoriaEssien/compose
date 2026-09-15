"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { exampleContent, postTypeLabels, postTypes, toneLabels, tonePresets } from "@/types/post";
import type { PostTypeRequest } from "@/types/post";

/** The stages the stream reports, in the order they happen. */
const stageCopy = {
  analyze: "Reading what you wrote",
  structure: "Finding the hook and the shape",
  plan: "Choosing a layout for every slide",
  save: "Saving the draft",
} as const;

type Stage = keyof typeof stageCopy;

const stageOrder = Object.keys(stageCopy) as Stage[];

// The same bounds generatePostInputSchema enforces, shown before you hit Generate.
const minContent = 20;
const maxContent = 6000;

export function CreatePostForm() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [context, setContext] = useState("");
  const [postType, setPostType] = useState<PostTypeRequest>("auto");
  const [tone, setTone] = useState<keyof typeof toneLabels>("brand");
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const abort = useRef<AbortController | null>(null);

  const pending = stage !== null;
  const length = content.trim().length;
  const tooShort = length < minContent;
  const tooLong = length > maxContent;

  function cancel() {
    abort.current?.abort();
    abort.current = null;
    setStage(null);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (tooShort) {
      setError("Give Compose a bit more to work with, at least a couple of sentences.");
      return;
    }

    if (tooLong) {
      setError(`That is ${length - maxContent} characters over. Trim it down to ${maxContent}.`);
      return;
    }

    const controller = new AbortController();
    abort.current = controller;
    setStage("analyze");

    try {
      const response = await fetch("/api/posts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          content: content.trim(),
          context: context.trim() || null,
          postType,
          tone: tone === "brand" ? null : tone,
        }),
      });

      if (!response.body) {
        setError("Generation failed. Check your connection and try again.");
        setStage(null);
        return;
      }

      // Newline-delimited JSON: one event per stage, then the outcome.
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);

          if ("stage" in event) setStage(event.stage);
          else if (event.ok) {
            router.push(`/posts/${event.postId}`);
            return;
          } else {
            setError(event.error);
            setStage(null);
            return;
          }
        }
      }

      setStage(null);
    } catch (failure) {
      // An abort is the user cancelling, which cancel() has already handled.
      if (!(failure instanceof DOMException && failure.name === "AbortError")) {
        setError("Generation failed. Check your connection and try again.");
        setStage(null);
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="grid gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Label htmlFor="content">What do you want to talk about?</Label>
          {content.length === 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => setContent(exampleContent)}
            >
              Try an example
            </Button>
          )}
        </div>
        <Textarea
          id="content"
          rows={10}
          placeholder="Paste your content here. A rough idea, a project update, or something you learned."
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={pending}
          aria-invalid={tooLong || undefined}
          aria-describedby="contentCount"
          required
        />
        <p
          id="contentCount"
          className={tooLong ? "text-destructive text-xs" : "text-muted-foreground text-xs"}
        >
          {tooLong
            ? `${length - maxContent} characters over the ${maxContent} limit. Trim it down.`
            : `${length} / ${maxContent} characters. Compose works best with a few sentences of detail.`}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="context">Anything else it should know?</Label>
        <Textarea
          id="context"
          rows={3}
          placeholder="Optional. Who this is for, what to emphasize, what to leave out."
          value={context}
          onChange={(event) => setContext(event.target.value)}
          disabled={pending}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="postType">Post type</Label>
          <Select
            value={postType}
            onValueChange={(value) => setPostType(value as PostTypeRequest)}
            disabled={pending}
          >
            <SelectTrigger id="postType" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["auto", ...postTypes] as const).map((value) => (
                <SelectItem key={value} value={value}>
                  {postTypeLabels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="tone">Tone</Label>
          <Select
            value={tone}
            onValueChange={(value) => setTone(value as keyof typeof toneLabels)}
            disabled={pending}
          >
            <SelectTrigger id="tone" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["brand", ...tonePresets] as const).map((value) => (
                <SelectItem key={value} value={value}>
                  {toneLabels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || tooShort || tooLong}>
          {pending ? "Generating..." : "Generate"}
        </Button>
        {pending && (
          <Button type="button" variant="ghost" onClick={cancel}>
            Cancel
          </Button>
        )}
      </div>

      {pending && stage && (
        <div className="grid gap-5 rounded-lg border p-5">
          <ol className="grid gap-2">
            {stageOrder.map((step, at) => {
              const current = stageOrder.indexOf(stage);
              const state = at < current ? "done" : at === current ? "now" : "next";

              return (
                <li
                  key={step}
                  className={
                    state === "next"
                      ? "text-muted-foreground/50 flex items-center gap-2.5 text-sm"
                      : "flex items-center gap-2.5 text-sm"
                  }
                >
                  <span
                    aria-hidden="true"
                    className={
                      state === "done"
                        ? "bg-foreground size-1.5 shrink-0 rounded-full"
                        : state === "now"
                          ? "bg-foreground size-1.5 shrink-0 animate-pulse rounded-full"
                          : "bg-muted-foreground/40 size-1.5 shrink-0 rounded-full"
                    }
                  />
                  {stageCopy[step]}
                </li>
              );
            })}
          </ol>

          <p aria-live="polite" className="sr-only">
            {stageCopy[stage]}
          </p>

          {/* The slide count is not known yet, but the shape of the result is. */}
          <div aria-hidden="true" className="flex gap-2">
            {[0, 1, 2].map((at) => (
              <Skeleton key={at} className="aspect-[4/5] w-14 rounded-md" />
            ))}
          </div>

          <p className="text-muted-foreground text-xs text-pretty">
            Around twenty seconds in total. You can cancel, and the draft is saved as soon as it
            exists, so closing this tab will not lose it.
          </p>
        </div>
      )}
    </form>
  );
}
