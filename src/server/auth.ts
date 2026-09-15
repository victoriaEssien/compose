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
import { passwordResetMail, sendMail } from "./email";

/**
 * Vercel gives every deployment its own hostname, so a single BETTER_AUTH_URL
 * cannot match them all and the origin check would reject sign-in.
 */
function vercelOrigins() {
  const { VERCEL_PROJECT_PRODUCTION_URL, VERCEL_URL } = env();

  return [VERCEL_PROJECT_PRODUCTION_URL, VERCEL_URL]
    .filter((host): host is string => Boolean(host))
    .map((host) => `https://${host}`);
}

export const auth = betterAuth({
  appName: "Compose",
  baseURL: env().BETTER_AUTH_URL,
  secret: env().BETTER_AUTH_SECRET,
  trustedOrigins: vercelOrigins(),
  database: drizzleAdapter(db(), { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Email and password is the only way in, so without this a forgotten
    // password locks the account permanently.
    sendResetPassword: async ({ user, url }) => {
      await sendMail({ to: user.email, ...passwordResetMail(url) });
    },
  },
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

/** The whole user, for the chrome that shows who is signed in. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session.user;
}

export async function currentUserId() {
  return (await getSession())?.user.id ?? null;
}
