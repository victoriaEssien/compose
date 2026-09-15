/** Better Auth server instance and session helpers. */
import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { seedBrandKit } from "./brand";
import { db } from "./db/client";
import * as schema from "./db/schema";

export const auth = betterAuth({
  appName: "Compose",
  baseURL: env().BETTER_AUTH_URL,
  secret: env().BETTER_AUTH_SECRET,
  database: drizzleAdapter(db(), { provider: "pg", schema }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  databaseHooks: {
    user: { create: { after: async (created) => seedBrandKit(created.id) } },
  },
  // nextCookies() has to stay last so it can set cookies from server actions.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Redirects to sign-in rather than returning null, for use in server components. */
export async function requireUserId() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session.user.id;
}

export async function currentUserId() {
  return (await getSession())?.user.id ?? null;
}
