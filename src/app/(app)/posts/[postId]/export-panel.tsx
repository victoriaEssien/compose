"use client";

import { Check, Copy, Download, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { captionText } from "@/types/caption";
import type { Caption } from "@/types/caption";
import { generateCaptionAction } from "./actions";

type Done = { count: number; filename: string; width: number; height: number };

/**
 * Export used to be a bare download link: several seconds of a page that looked
 * idle, then a file and nothing else. This gives the wait a state and the finish
 * a moment, which is where the caption is worth the most.
 */
export function ExportPanel({
  postId,
  format,
  slideCount,
  width,
  height,
}: {
  postId: string;
  format: string;
  slideCount: number;
  width: number;
  height: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [caption, setCaption] = useState<Caption | null>(null);
  const [captionPending, setCaptionPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function filenameFrom(response: Response, fallback: string) {
    const header = response.headers.get("Content-Disposition") ?? "";
    return /filename="([^"]+)"/.exec(header)?.[1] ?? fallback;
  }

  async function exportAll() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${postId}/export?format=${format}`);

      if (!response.ok) {
        setError(await response.text());
        return;
      }

      const blob = await response.blob();
      const filename = filenameFrom(response, "post.zip");

      // Revoked on the next tick: Safari cancels the download if it goes sooner.
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);

      setDone({ count: slideCount, filename, width, height });
      // The post is marked exported server-side, so the dashboard has moved on.
      router.refresh();
    } catch {
      setError("The download did not start. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  async function writeCaption() {
    setCaptionPending(true);
    const result = await generateCaptionAction(postId);
    setCaptionPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setCaption(result.caption);
  }

  async function copyCaption() {
    if (!caption) return;

    try {
      await navigator.clipboard.writeText(captionText(caption));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not reach the clipboard. Select the text and copy it.");
    }
  }

  function close() {
    setDone(null);
    setCaption(null);
    setCopied(false);
  }

  return (
    <>
      <Button size="sm" disabled={pending} onClick={exportAll}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Rendering {slideCount} slides...
          </>
        ) : (
          <>
            <Download className="size-4" />
            Download all
          </>
        )}
      </Button>

      {error && (
        <p role="alert" className="text-destructive w-full text-sm">
          {error}
        </p>
      )}

      <Dialog open={done !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Your carousel is ready to post</DialogTitle>
            <DialogDescription>
              {done?.count} PNGs at {done?.width} by {done?.height}, in{" "}
              <span className="font-medium">{done?.filename}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            {caption ? (
              <>
                <div className="max-h-56 overflow-y-auto rounded-lg border p-3">
                  <p className="text-sm whitespace-pre-wrap">{caption.caption}</p>
                  <p className="text-muted-foreground mt-3 text-sm break-words">
                    {caption.hashtags.map((tag) => `#${tag}`).join(" ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={copyCaption}>
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {copied ? "Copied" : "Copy caption"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={captionPending}
                    onClick={writeCaption}
                  >
                    {captionPending ? "Writing..." : "Write another"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-muted-foreground text-sm">
                  The slides carry the argument. Compose can write the caption that sets it up, from
                  the same content and your brand voice.
                </p>
                <div>
                  <Button size="sm" disabled={captionPending} onClick={writeCaption}>
                    {captionPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Writing the caption...
                      </>
                    ) : (
                      "Write the caption"
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
