"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { SettingsCard } from "./settings-card";

export function Sessions({ memberSince }: { memberSince: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function revokeOthers() {
    setPending(true);
    const { error } = await authClient.revokeOtherSessions();
    setPending(false);

    if (error) {
      toast.error(error.message ?? "Could not sign the other devices out.");
      return;
    }

    toast.success("Every other device has been signed out.");
  }

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <SettingsCard
      title="Sessions"
      description={`You have been using Compose since ${memberSince}. Signing other devices out leaves this one alone.`}
      footer={
        <>
          <Button type="button" variant="outline" disabled={pending} onClick={revokeOthers}>
            {pending ? "Signing out..." : "Sign out other devices"}
          </Button>
          <Button type="button" variant="destructive" disabled={signingOut} onClick={signOut}>
            {signingOut ? "Signing out..." : "Sign out"}
          </Button>
        </>
      }
    />
  );
}
