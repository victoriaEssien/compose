"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/server/auth";
import { createAsset, removeAsset, renameAsset } from "@/server/assets";
import { uploadUserFile } from "@/server/storage/blob";
import { assetTypeSchema } from "@/types/asset";

export type AssetActionResult = { ok: boolean; error: string | null };

const ok: AssetActionResult = { ok: true, error: null };

export async function uploadAssetAction(formData: FormData): Promise<AssetActionResult> {
  const userId = await requireUserId();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file to upload." };
  }

  const type = assetTypeSchema.safeParse(formData.get("type"));
  if (!type.success) return { ok: false, error: "Pick an asset type." };

  const upload = await uploadUserFile(userId, file);
  if (!upload.ok) return { ok: false, error: upload.error };

  const name = String(formData.get("name") ?? "").trim() || file.name;
  await createAsset({ userId, name: name.slice(0, 120), type: type.data, url: upload.url });

  revalidatePath("/assets");
  return ok;
}

export async function renameAssetAction(id: string, name: string): Promise<AssetActionResult> {
  const userId = await requireUserId();

  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Give the asset a name." };

  await renameAsset(userId, id, trimmed.slice(0, 120));
  revalidatePath("/assets");
  return ok;
}

export async function deleteAssetAction(id: string): Promise<AssetActionResult> {
  const userId = await requireUserId();
  await removeAsset(userId, id);
  revalidatePath("/assets");
  return ok;
}
