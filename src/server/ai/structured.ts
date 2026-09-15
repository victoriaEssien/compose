/** Turns a model response into a validated value, or a clean error. */
import "server-only";
import { z } from "zod";

import type { AiProvider } from "./provider";

export class AiError extends Error {
  readonly stage: string;

  constructor(stage: string, message: string) {
    super(`${stage}: ${message}`);
    this.name = "AiError";
    this.stage = stage;
  }
}

/** OpenAI accepts anyOf but not oneOf, which is what Zod emits for a union. */
function toModelJsonSchema(schema: z.ZodType) {
  const json = z.toJSONSchema(schema, { unrepresentable: "any" });

  const rewrite = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(rewrite);
    if (node === null || typeof node !== "object") return node;

    return Object.fromEntries(
      Object.entries(node as Record<string, unknown>)
        .filter(([key]) => key !== "$schema")
        .map(([key, value]) => [key === "oneOf" ? "anyOf" : key, rewrite(value)]),
    );
  };

  return rewrite(json) as Record<string, unknown>;
}

function parseJson(raw: string): { ok: true; value: unknown } | { ok: false; problem: string } {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false, problem: "the response was not valid JSON" };
  }
}

function describe(error: z.ZodError) {
  return error.issues
    .slice(0, 5)
    .map((issue) => `${issue.path.join(".") || "root"} ${issue.message}`)
    .join("; ");
}

/**
 * One retry, with the rejection reason fed back to the model. A second failure
 * is a real error rather than something to keep paying for.
 */
export async function generateStructured<T>(
  provider: AiProvider,
  request: { name: string; system: string; user: string; schema: z.ZodType<T> },
): Promise<T> {
  const jsonSchema = toModelJsonSchema(request.schema);
  let problem = "";

  for (let attempt = 0; attempt < 2; attempt++) {
    const user = problem
      ? `${request.user}\n\nYour previous answer was rejected because ${problem}. Return JSON that satisfies the schema.`
      : request.user;

    const raw = await provider.generateJson({
      name: request.name,
      system: request.system,
      user,
      jsonSchema,
    });

    const parsed = parseJson(raw);
    if (!parsed.ok) {
      problem = parsed.problem;
      continue;
    }

    const validated = request.schema.safeParse(parsed.value);
    if (validated.success) return validated.data;

    problem = describe(validated.error);
  }

  throw new AiError(request.name, `the model returned invalid output twice (${problem})`);
}
