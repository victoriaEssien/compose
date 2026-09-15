/** Vercel Blob uploads, scoped to one user per path prefix. */
import "server-only";
import { del, put } from "@vercel/blob";

import { env } from "@/lib/env";
import { allowedUploadTypes, maxUploadBytes } from "@/types/asset";

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

const missingToken =
  "File uploads need BLOB_READ_WRITE_TOKEN. Create a Vercel Blob store and add it to .env.local.";

function isAllowedType(type: string): type is (typeof allowedUploadTypes)[number] {
  return (allowedUploadTypes as readonly string[]).includes(type);
}

/** Strips anything that would let a filename escape the user's own prefix. */
function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
}

export async function uploadUserFile(userId: string, file: File): Promise<UploadResult> {
  if (!isAllowedType(file.type)) {
    return { ok: false, error: "Upload a PNG, JPEG, WebP, GIF or SVG." };
  }
  if (file.size > maxUploadBytes) {
    return { ok: false, error: `Files are limited to ${maxUploadBytes / 1024 / 1024}MB.` };
  }

  const token = env().BLOB_READ_WRITE_TOKEN;
  if (!token) return { ok: false, error: missingToken };

  const blob = await put(`users/${userId}/${crypto.randomUUID()}-${safeName(file.name)}`, file, {
    access: "public",
    contentType: file.type,
    token,
  });

  return { ok: true, url: blob.url };
}

export async function deleteUserFile(url: string) {
  // Without a token nothing was ever uploaded, so there is no blob to orphan.
  const token = env().BLOB_READ_WRITE_TOKEN;
  if (!token) return;
  await del(url, { token });
}
