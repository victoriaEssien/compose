/** The seam that lets tests swap canned responses in for the real model. */
import "server-only";

export type JsonRequest = {
  /** Names the schema for the model and for error messages. */
  name: string;
  system: string;
  user: string;
  jsonSchema: Record<string, unknown>;
};

export interface AiProvider {
  /** Returns the model's raw JSON text. Validation happens in generateStructured. */
  generateJson(request: JsonRequest): Promise<string>;
}
