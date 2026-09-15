"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { SettingsCard } from "./settings-card";

/** Better Auth is configured with this minimum, so the form should say so up front. */
const minPasswordLength = 8;

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooShort = next.length > 0 && next.length < minPasswordLength;
  const mismatch = confirm.length > 0 && next !== confirm;
  const ready = current.length > 0 && next.length >= minPasswordLength && next === confirm;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready) return;

    setPending(true);
    setError(null);
    // Every other session is signed out: a password change is usually a
    // response to losing control of one, and leaving them alive defeats it.
    const result = await authClient.changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: true,
    });
    setPending(false);

    if (result.error) {
      setError(result.error.message ?? "Could not change your password.");
      return;
    }

    setCurrent("");
    setNext("");
    setConfirm("");
    toast.success("Password changed. Other devices have been signed out.");
  }

  return (
    <form onSubmit={onSubmit}>
      <SettingsCard
        title="Password"
        description="Changing it signs you out everywhere else, on every other device."
        footer={
          <>
            {error && (
              <span role="alert" className="text-destructive mr-auto text-sm text-pretty">
                {error}
              </span>
            )}
            <Button type="submit" disabled={pending || !ready}>
              {pending ? "Changing..." : "Change password"}
            </Button>
          </>
        }
      >
        <div className="grid gap-5 sm:max-w-sm">
          <div className="grid gap-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={tooShort}
              aria-describedby="newPasswordHint"
              value={next}
              onChange={(event) => setNext(event.target.value)}
            />
            <p
              id="newPasswordHint"
              className={tooShort ? "text-destructive text-xs" : "text-muted-foreground text-xs"}
            >
              At least {minPasswordLength} characters.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={mismatch}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
            {mismatch && (
              <p role="status" className="text-destructive text-xs">
                These two do not match.
              </p>
            )}
          </div>
        </div>
      </SettingsCard>
    </form>
  );
}
