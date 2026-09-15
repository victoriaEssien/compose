"use client";

import { useState, useTransition } from "react";

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
import { exampleContent, postTypeLabels, postTypes, toneLabels, tonePresets } from "@/types/post";
import type { PostTypeRequest } from "@/types/post";
import { createPostAction } from "./actions";

// The same bounds generatePostInputSchema enforces, shown before you hit Generate.
const minContent = 20;
const maxContent = 6000;

export function CreatePostForm() {
  const [content, setContent] = useState("");
  const [context, setContext] = useState("");
  const [postType, setPostType] = useState<PostTypeRequest>("auto");
  const [tone, setTone] = useState<keyof typeof toneLabels>("brand");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const length = content.trim().length;
  const tooShort = length < minContent;
  const tooLong = length > maxContent;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
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

    startTransition(async () => {
      // A success redirects, so anything that comes back is a failure.
      const result = await createPostAction({
        content: content.trim(),
        context: context.trim() || null,
        postType,
        tone: tone === "brand" ? null : tone,
      });

      setError(result.error);
    });
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

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || tooShort || tooLong}>
          {pending ? "Generating..." : "Generate"}
        </Button>
        {pending && (
          <span aria-live="polite" className="text-muted-foreground text-sm">
            Reading your content, structuring it and planning the slides. About 20 seconds.
          </span>
        )}
      </div>
    </form>
  );
}
