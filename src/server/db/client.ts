/**
 * Database client (Drizzle over Neon's serverless HTTP driver).
 * Any PostgreSQL database works; swap the driver here if not using Neon.
 */
import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { env } from "@/lib/env";
import * as schema from "./schema";

let instance: ReturnType<typeof create> | undefined;

function create() {
  return drizzle(neon(env().DATABASE_URL), { schema, casing: "snake_case" });
}

/** Lazily created so importing this module never needs DATABASE_URL at build time. */
export function db() {
  if (!instance) instance = create();
  return instance;
}
