"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ImageField } from "@/components/image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import type { AssetRow } from "@/server/db/schema";
import { SettingsCard } from "./settings-card";

export function ProfileForm({
  assets,
  initial,
}: {
  assets: AssetRow[];
  initial: { name: string; email: string; image: string | null };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [image, setImage] = useState(initial.image);
  const [pending, setPending] = useState(false);

  const dirty = name.trim() !== initial.name || image !== initial.image;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;

    setPending(true);
    const { error } = await authClient.updateUser({ name: name.trim(), image: image ?? "" });
    setPending(false);

    if (error) {
      toast.error(error.message ?? "Could not save your profile.");
      return;
    }

    toast.success("Profile saved.");
    // The sidebar reads this from the session on the server, so it needs a pass.
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <SettingsCard
        title="Profile"
        description="Your name and picture, shown in this app. Neither is drawn on your slides: the handle and avatar on a slide come from your Brand Kit."
        footer={
          <Button type="submit" disabled={pending || !dirty || !name.trim()}>
            {pending ? "Saving..." : "Save profile"}
          </Button>
        }
      >
        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="displayName">Name</Label>
            <Input
              id="displayName"
              value={name}
              maxLength={80}
              autoComplete="name"
              required
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <ImageField
            id="profileImage"
            label="Picture"
            shape="circle"
            hint="Pick one from your assets, or leave it and Compose uses your initials."
            assets={assets}
            value={image}
            onChange={setImage}
          />

          <div className="grid gap-2">
            <Label htmlFor="accountEmail">Email</Label>
            <Input id="accountEmail" value={initial.email} readOnly disabled autoComplete="email" />
            <p className="text-muted-foreground text-xs text-pretty">
              This is how you sign in, and where a password reset is sent. Changing it needs a
              verified address, which Compose does not do yet.
            </p>
          </div>
        </div>
      </SettingsCard>
    </form>
  );
}
