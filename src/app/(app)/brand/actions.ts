"use server";

import { revalidatePath } from "next/cache";

import { firstIssueMessage } from "@/lib/issues";
import { requireUserId } from "@/server/auth";
import { saveBrandKit } from "@/server/brand";
import { brandKitSchema } from "@/types/brand";

export type SaveBrandKitResult = { saved: boolean; error: string | null };

export async function saveBrandKitAction(input: unknown): Promise<SaveBrandKitResult> {
  const userId = await requireUserId();
  const parsed = brandKitSchema.safeParse(input);

  if (!parsed.success) return { saved: false, error: firstIssueMessage(parsed.error) };

  await saveBrandKit(userId, parsed.data);
  revalidatePath("/brand");
  revalidatePath("/dashboard");

  return { saved: true, error: null };
}
