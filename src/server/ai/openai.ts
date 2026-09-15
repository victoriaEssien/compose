/** The real provider. Swap this out to change model vendor. */
import "server-only";
import OpenAI from "openai";

import { env } from "@/lib/env";
import type { AiProvider } from "./provider";
import { AiError } from "./structured";

let client: OpenAI | undefined;

function openai() {
  if (!client) client = new OpenAI({ apiKey: env().OPENAI_API_KEY });
  return client;
}

export function openAiProvider(): AiProvider {
  return {
    async generateJson({ name, system, user, jsonSchema }) {
      // OpenAI allows only [a-zA-Z0-9_-] here, and our stage versions contain dots.
      const schemaName = name.replace(/[^a-zA-Z0-9_-]/g, "_");

      const completion = await openai().chat.completions.create({
        model: env().OPENAI_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: schemaName, schema: jsonSchema, strict: false },
        },
      });

      const content = completion.choices[0]?.message.content;
      if (!content) throw new AiError(name, "the model returned no content");

      return content;
    },
  };
}
