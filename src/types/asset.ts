/** Asset library (spec section 16). */
import { z } from "zod";

export const assetTypes = [
  "screenshot",
  "logo",
  "avatar",
  "illustration",
  "photo",
  "other",
] as const;

export const assetTypeSchema = z.enum(assetTypes);

export type AssetType = z.infer<typeof assetTypeSchema>;

export const maxUploadBytes = 8 * 1024 * 1024;

export const allowedUploadTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
] as const;
