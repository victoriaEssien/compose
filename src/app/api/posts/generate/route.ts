import { generatePost } from "@/server/ai/generate-post";
import type { GenerateStage } from "@/server/ai/generate-post";
import { AiError } from "@/server/ai/structured";
import { currentUserId } from "@/server/auth";
import { loadBrandKit } from "@/server/brand";
import { createPostFromSpec } from "@/server/posts";
import { firstIssueMessage } from "@/lib/issues";
import { generatePostInputSchema } from "@/types/post";

export type GenerateEvent =
  { stage: GenerateStage | "save" } | { ok: true; postId: string } | { ok: false; error: string };

/**
 * Streams the pipeline instead of returning once at the end.
 *
 * The three model calls take about twenty seconds together, and the server knows
 * exactly which one is running. As a server action that knowledge had nowhere to
 * go, so the client showed one static sentence for the whole wait.
 *
 * The post is also written before the final event, so closing the tab
 * mid-generation leaves a draft rather than discarding paid-for work.
 */
export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const parsed = generatePostInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ ok: false, error: firstIssueMessage(parsed.error) });
  }

  const brand = await loadBrandKit(userId);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: GenerateEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));

      try {
        const generated = await generatePost(parsed.data, brand, undefined, (stage) =>
          send({ stage }),
        );

        send({ stage: "save" });
        const postId = await createPostFromSpec({
          userId,
          input: parsed.data,
          spec: generated.spec,
        });

        send({ ok: true, postId });
      } catch (failure) {
        console.error("generatePost failed", failure);
        send({
          ok: false,
          error:
            failure instanceof AiError
              ? `The model could not produce a usable post (${failure.stage}). Try rewording your content.`
              : "Generation failed. Check your connection and try again.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      // Proxies that buffer would defeat the point of streaming at all.
      "X-Accel-Buffering": "no",
    },
  });
}
