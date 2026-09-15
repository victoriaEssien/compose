"use client";

import Image from "next/image";
import { useState, useTransition } from "react";

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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AssetRow } from "@/server/db/schema";
import { deleteAssetAction, renameAssetAction } from "./actions";

export function AssetList({ assets }: { assets: AssetRow[] }) {
  const [renaming, setRenaming] = useState<AssetRow | null>(null);
  const [deleting, setDeleting] = useState<AssetRow | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openRename(row: AssetRow) {
    setRenaming(row);
    setName(row.name);
    setError(null);
  }

  function submitRename(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!renaming) return;

    startTransition(async () => {
      const result = await renameAssetAction(renaming.id, name);
      if (result.ok) setRenaming(null);
      else setError(result.error);
    });
  }

  function remove(row: AssetRow) {
    setDeleting(null);
    startTransition(async () => {
      const result = await deleteAssetAction(row.id);
      setError(result.error);
    });
  }

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((row) => (
          <li key={row.id} className="overflow-hidden rounded-lg border">
            <div className="bg-muted relative aspect-[4/3]">
              <Image
                src={row.url}
                alt={row.name}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-contain"
              />
            </div>
            <div className="flex items-center gap-2 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{row.name}</p>
                <p className="text-muted-foreground text-xs capitalize">{row.type}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={pending}>
                    {pending ? "Working..." : "Edit"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => openRename(row)}>Rename</DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(row)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="text-destructive mt-4 text-sm">
          {error}
        </p>
      )}

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The file is removed from storage, so this cannot be undone. Slides already using it
              will lose their image.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && remove(deleting)}>
              Delete asset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={renaming !== null} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitRename} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="assetName">Name</Label>
              <Input
                id="assetName"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
