"use client";

import { useRef, useState, useTransition } from "react";

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
import { allowedUploadTypes, assetTypes } from "@/types/asset";
import { uploadAssetAction } from "./actions";

const typeLabels = {
  screenshot: "Screenshot",
  logo: "Logo",
  avatar: "Avatar",
  illustration: "Illustration",
  photo: "Photo",
  other: "Other",
} as const;

export function AssetUploader() {
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<(typeof assetTypes)[number]>("screenshot");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    data.set("type", type);

    startTransition(async () => {
      const result = await uploadAssetAction(data);
      setError(result.error);
      if (result.ok) formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="grid gap-4 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
    >
      <div className="grid gap-2">
        <Label htmlFor="file">File</Label>
        <Input
          id="file"
          name="file"
          type="file"
          accept={allowedUploadTypes.join(",")}
          required
          onChange={() => setError(null)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" placeholder="Optional, defaults to the filename" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="type">Type</Label>
        <Select value={type} onValueChange={(value) => setType(value as typeof type)}>
          <SelectTrigger id="type" className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {assetTypes.map((value) => (
              <SelectItem key={value} value={value}>
                {typeLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={pending} className="sm:col-start-3">
        {pending ? "Uploading..." : "Upload"}
      </Button>

      {error && (
        <p role="alert" className="text-destructive text-sm sm:col-span-3">
          {error}
        </p>
      )}
    </form>
  );
}
