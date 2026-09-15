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

/** Cuts at the last sentence, else the last word, so a trim never lands mid-word. */
export function trimTo(value: string, max: number) {
  if (value.length <= max) return value;

  const head = value.slice(0, max);
  const sentence = Math.max(head.lastIndexOf(". "), head.lastIndexOf("! "), head.lastIndexOf("? "));
  if (sentence >= max * 0.6) return head.slice(0, sentence + 1);

  const word = head.slice(0, max - 1).lastIndexOf(" ");
  return `${(word > 0 ? head.slice(0, word) : head.slice(0, max - 1)).trimEnd()}…`;
}

function setAt(root: unknown, path: PropertyKey[], value: string) {
  let node = root as Record<PropertyKey, unknown>;
  for (const key of path.slice(0, -1)) {
    node = node?.[key] as Record<PropertyKey, unknown>;
    if (node === null || typeof node !== "object") return;
  }
  const last = path.at(-1);
  if (last !== undefined) node[last] = value;
}

/**
 * Models cannot count characters, so overlong text is the one failure worth
 * repairing rather than retrying. Nothing else is touched: if other issues
 * remain the value still fails and the retry runs as normal.
 */
function repairOverlongText(payload: unknown, error: z.ZodError) {
  const overlong = error.issues.filter(
    (issue): issue is z.core.$ZodIssueTooBig =>
      issue.code === "too_big" && issue.origin === "string",
  );
  if (overlong.length === 0) return null;

  const repaired = structuredClone(payload);
  for (const issue of overlong) {
    const max = Number(issue.maximum);
    if (!Number.isFinite(max)) continue;

    const current = issue.path.reduce<unknown>(
      (node, key) => (node as Record<PropertyKey, unknown>)?.[key],
      repaired,
    );
    if (typeof current === "string") setAt(repaired, issue.path, trimTo(current, max));
  }

  return repaired;
}

/**
 * One retry, with the rejection reason fed back to the model. A second failure
 * is a real error rather than something to keep paying for.
 */
export async function generateStructured<T>(
  provider: AiProvider,
  request: { name: string; system: string; user: string; schema: z.ZodType<T> },
): Promise<T> {
  const schema = toModelJsonSchema(request.schema);

  // OpenAI insists on an object at the root, which a bare union is not.
  const wrapped = schema.type !== "object";
  const jsonSchema = wrapped
    ? {
        type: "object",
        properties: { value: schema },
        required: ["value"],
        additionalProperties: false,
      }
    : schema;

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

    const payload = wrapped ? (parsed.value as { value?: unknown })?.value : parsed.value;
    const validated = request.schema.safeParse(payload);
    if (validated.success) return validated.data;

    const repaired = repairOverlongText(payload, validated.error);
    if (repaired !== null) {
      const revalidated = request.schema.safeParse(repaired);
      if (revalidated.success) return revalidated.data;
    }

    problem = describe(validated.error);
  }

  throw new AiError(request.name, `the model returned invalid output twice (${problem})`);
}
