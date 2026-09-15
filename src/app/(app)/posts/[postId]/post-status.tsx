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
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={value}
      disabled={pending}
      onValueChange={(next) => {
        setValue(next as PostStatus);
        startTransition(async () => {
          await setPostStatusAction(postId, next);
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
  );
}
