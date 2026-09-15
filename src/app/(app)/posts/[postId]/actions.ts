"use server";

import { revalidatePath } from "next/cache";

import { generateCaption } from "@/server/ai/caption";
import { generateIllustration } from "@/server/ai/illustration";
import { regenerateSlide } from "@/server/ai/regenerate";
import { AiError } from "@/server/ai/structured";
import { firstIssueMessage } from "@/lib/issues";
import { createAsset } from "@/server/assets";
import { requireUserId } from "@/server/auth";
import { loadBrandKit } from "@/server/brand";
import { loadPost, setPostStatus } from "@/server/posts";
import {
  deleteSlide,
  duplicateSlide,
  insertSlideAt,
  loadSlide,
  moveSlide,
  moveSlideTo,
  setSlideIllustration,
  updateSlide,
} from "@/server/slides";
import { uploadGeneratedImage } from "@/server/storage/blob";
import { remapSlide } from "@/templates";
import type { Caption } from "@/types/caption";
import { postStatusSchema } from "@/types/post";
import {
  regenerateActionSchema,
  slideDesignConfigSchema,
  slideSpecSchema,
  templateKindSchema,
} from "@/types/slide";

export type SlideActionResult = { ok: boolean; error: string | null };

const done: SlideActionResult = { ok: true, error: null };
const missing: SlideActionResult = { ok: false, error: "That slide is gone. Reload the page." };

function revalidate(postId: string) {
  revalidatePath(`/posts/${postId}`);
  revalidatePath("/dashboard");
}

export async function saveSlideAction(
  postId: string,
  slideId: string,
  content: unknown,
  designConfig: unknown,
): Promise<SlideActionResult> {
  const userId = await requireUserId();

  const parsedContent = slideSpecSchema.safeParse(content);
  if (!parsedContent.success) return { ok: false, error: firstIssueMessage(parsedContent.error) };

  const parsedDesign = slideDesignConfigSchema.safeParse(designConfig ?? {});
  if (!parsedDesign.success) return { ok: false, error: firstIssueMessage(parsedDesign.error) };

  const saved = await updateSlide(userId, postId, slideId, {
    content: parsedContent.data,
    designConfig: Object.keys(parsedDesign.data).length > 0 ? parsedDesign.data : null,
  });
  if (!saved) return missing;

  revalidate(postId);
  return done;
}

export async function changeTemplateAction(
  postId: string,
  slideId: string,
  template: unknown,
): Promise<SlideActionResult> {
  const userId = await requireUserId();

  const parsed = templateKindSchema.safeParse(template);
  if (!parsed.success) return { ok: false, error: "That is not a template." };

  const slide = await loadSlide(userId, postId, slideId);
  if (!slide) return missing;

  const saved = await updateSlide(userId, postId, slideId, {
    content: remapSlide(slide.content, parsed.data),
    designConfig: slide.designConfig,
  });
  if (!saved) return missing;

  revalidate(postId);
  return done;
}

export async function duplicateSlideAction(
  postId: string,
  slideId: string,
): Promise<SlideActionResult> {
  const userId = await requireUserId();

  if (!(await duplicateSlide(userId, postId, slideId))) return missing;

  revalidate(postId);
  return done;
}

export async function deleteSlideAction(
  postId: string,
  slideId: string,
): Promise<SlideActionResult> {
  const userId = await requireUserId();

  if (!(await deleteSlide(userId, postId, slideId))) {
    return { ok: false, error: "A post needs at least one slide." };
  }

  revalidate(postId);
  return done;
}

/** Undo for a delete. The client kept the slide it was holding, so it can hand it back. */
export async function restoreSlideAction(
  postId: string,
  at: number,
  content: unknown,
  designConfig: unknown,
  imageUrl: string | null,
): Promise<SlideActionResult> {
  const userId = await requireUserId();

  const parsedContent = slideSpecSchema.safeParse(content);
  if (!parsedContent.success) return { ok: false, error: firstIssueMessage(parsedContent.error) };

  const parsedDesign = slideDesignConfigSchema.safeParse(designConfig ?? {});
  if (!parsedDesign.success) return { ok: false, error: firstIssueMessage(parsedDesign.error) };

  const restored = await insertSlideAt(userId, postId, Math.max(0, at), {
    content: parsedContent.data,
    designConfig: Object.keys(parsedDesign.data).length > 0 ? parsedDesign.data : null,
    imageUrl,
  });
  if (!restored) return missing;

  revalidate(postId);
  return done;
}

export async function moveSlideAction(
  postId: string,
  slideId: string,
  direction: -1 | 1,
): Promise<SlideActionResult> {
  const userId = await requireUserId();

  if (!(await moveSlide(userId, postId, slideId, direction))) return missing;

  revalidate(postId);
  return done;
}

/** Dropping a thumbnail somewhere else in the filmstrip. */
export async function reorderSlideAction(
  postId: string,
  slideId: string,
  to: number,
): Promise<SlideActionResult> {
  const userId = await requireUserId();

  if (!Number.isInteger(to) || to < 0) return { ok: false, error: "That is not a position." };
  if (!(await moveSlideTo(userId, postId, slideId, to))) return missing;

  revalidate(postId);
  return done;
}

export async function regenerateSlideAction(
  postId: string,
  slideId: string,
  action: unknown,
  instruction: string | null,
): Promise<SlideActionResult> {
  const userId = await requireUserId();

  const parsed = regenerateActionSchema.safeParse(action);
  if (!parsed.success) return { ok: false, error: "That is not a regenerate option." };

  const [found, brand] = await Promise.all([loadPost(userId, postId), loadBrandKit(userId)]);
  if (!found) return missing;

  const target = found.slides.find((row) => row.id === slideId);
  if (!target) return missing;

  let rewritten;
  try {
    rewritten = await regenerateSlide({
      slide: target.content,
      action: parsed.data,
      instruction: instruction?.trim() || null,
      brand,
      postTitle: found.post.title,
      originalContent: found.post.originalContent,
      otherSlides: found.slides.filter((row) => row.id !== slideId).map((row) => row.content),
    });
  } catch (failure) {
    console.error("regenerateSlide failed", failure);
    return {
      ok: false,
      error:
        failure instanceof AiError
          ? "The model could not produce a usable slide. Try a different option."
          : "Regeneration failed. Check your connection and try again.",
    };
  }

  await updateSlide(userId, postId, slideId, {
    content: rewritten,
    designConfig: target.designConfig,
  });

  revalidate(postId);
  return done;
}

/**
 * The caption for the completion panel. Separate from export so a model failure
 * never costs the user their download, which is the thing they actually came for.
 */
export async function generateCaptionAction(
  postId: string,
): Promise<{ ok: true; caption: Caption } | { ok: false; error: string }> {
  const userId = await requireUserId();

  const [found, brand] = await Promise.all([loadPost(userId, postId), loadBrandKit(userId)]);
  if (!found) return { ok: false, error: "That post is gone. Reload the page." };

  try {
    const caption = await generateCaption({
      brand,
      postTitle: found.post.title,
      originalContent: found.post.originalContent,
      slides: found.slides.map((row) => row.content),
    });

    return { ok: true, caption };
  } catch (failure) {
    console.error("generateCaption failed", failure);
    return {
      ok: false,
      error:
        failure instanceof AiError
          ? "The model could not write a usable caption. Try again."
          : "Caption generation failed. Check your connection and try again.",
    };
  }
}

export async function setPostStatusAction(
  postId: string,
  status: unknown,
): Promise<SlideActionResult> {
  const userId = await requireUserId();

  const parsed = postStatusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, error: "That is not a status." };

  if (!(await setPostStatus(userId, postId, parsed.data))) return missing;

  revalidate(postId);
  return done;
}

export async function generateIllustrationAction(
  postId: string,
  slideId: string,
): Promise<SlideActionResult> {
  const userId = await requireUserId();

  const [slide, brand] = await Promise.all([
    loadSlide(userId, postId, slideId),
    loadBrandKit(userId),
  ]);
  if (!slide) return missing;

  const hint = slide.content.visual;
  if (!hint) return { ok: false, error: "Give the slide a visual hint first." };

  let image;
  try {
    image = await generateIllustration(hint, brand);
  } catch (failure) {
    console.error("generateIllustration failed", failure);
    return { ok: false, error: "The image model did not respond. Try again." };
  }
  if (!image.ok) return { ok: false, error: image.error };

  const upload = await uploadGeneratedImage(userId, image.bytes, image.contentType);
  if (!upload.ok) return { ok: false, error: upload.error };

  // Into the library as well (spec section 16), so a good result can be reused
  // on another slide instead of being paid for twice.
  await createAsset({
    userId,
    name: `Illustration: ${hint}`.slice(0, 80),
    type: "illustration",
    url: upload.url,
  });

  await setSlideIllustration(userId, postId, slideId, upload.url);
  revalidate(postId);
  revalidatePath("/assets");

  return done;
}

export async function removeIllustrationAction(
  postId: string,
  slideId: string,
): Promise<SlideActionResult> {
  const userId = await requireUserId();

  if (!(await setSlideIllustration(userId, postId, slideId, null))) return missing;

  revalidate(postId);
  return done;
}
