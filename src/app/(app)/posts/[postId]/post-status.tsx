"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { postStatuses } from "@/types/post";
import type { PostStatus } from "@/types/post";
import { setPostStatusAction } from "./actions";

const labels: Record<PostStatus, string> = {
  draft: "Draft",
  ready: "Ready",
  exported: "Exported",
};

export function PostStatusSelect({ postId, status }: { postId: string; status: PostStatus }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Select
        value={value}
        disabled={pending}
        onValueChange={(next) => {
          const previous = value;
          setValue(next as PostStatus);
          setError(null);

          startTransition(async () => {
            const result = await setPostStatusAction(postId, next);

            // The optimistic change used to stand even when the write failed.
            if (!result.ok) {
              setValue(previous);
              setError(result.error);
              return;
            }

            router.refresh();
          });
        }}
      >
        <SelectTrigger size="sm" className="w-32" aria-label="Post status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {postStatuses.map((option) => (
            <SelectItem key={option} value={option}>
              {labels[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span aria-live="polite" className="sr-only">
        {pending ? "Saving status" : `Status: ${labels[value]}`}
      </span>

      {error && (
        <span role="alert" className="text-destructive text-xs">
          {error}
        </span>
      )}
    </div>
  );
}
