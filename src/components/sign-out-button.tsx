"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" disabled={pending} onClick={onClick}>
      <span aria-live="polite">{pending ? "Signing out..." : "Sign out"}</span>
    </Button>
  );
}
