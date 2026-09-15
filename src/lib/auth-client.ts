/** Browser-side Better Auth client. Base URL is inferred from the current origin. */
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const { signIn, signOut, signUp, useSession } = authClient;
