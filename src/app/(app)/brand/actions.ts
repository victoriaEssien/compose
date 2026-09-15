"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/server/auth";
import { saveBrandKit } from "@/server/brand";
import { brandKitSchema } from "@/types/brand";

export type SaveBrandKitResult = { saved: boolean; error: string | null };

export async function saveBrandKitAction(input: unknown): Promise<SaveBrandKitResult> {
  const userId = await requireUserId();
  const parsed = brandKitSchema.safeParse(input);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { saved: false, error: `${issue.path.join(" ")}: ${issue.message}`.trim() };
  }

  await saveBrandKit(userId, parsed.data);
  revalidatePath("/brand");
  revalidatePath("/dashboard");

  return { saved: true, error: null };
}
