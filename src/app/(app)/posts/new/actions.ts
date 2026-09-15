"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { firstIssueMessage } from "@/lib/issues";
import { generatePost } from "@/server/ai/generate-post";
import { AiError } from "@/server/ai/structured";
import { requireUserId } from "@/server/auth";
import { loadBrandKit } from "@/server/brand";
import { createPostFromSpec } from "@/server/posts";
import { generatePostInputSchema } from "@/types/post";

export type CreatePostResult = { error: string };

export async function createPostAction(input: unknown): Promise<CreatePostResult> {
  const userId = await requireUserId();

  const parsed = generatePostInputSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const brand = await loadBrandKit(userId);

  let generated;
  try {
    generated = await generatePost(parsed.data, brand);
  } catch (failure) {
    console.error("generatePost failed", failure);
    return {
      error:
        failure instanceof AiError
          ? `The model could not produce a usable post (${failure.stage}). Try rewording your content.`
          : "Generation failed. Check your connection and try again.",
    };
  }

  const postId = await createPostFromSpec({ userId, input: parsed.data, spec: generated.spec });
  revalidatePath("/dashboard");

  redirect(`/posts/${postId}`);
}
