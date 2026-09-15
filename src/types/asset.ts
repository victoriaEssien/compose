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
