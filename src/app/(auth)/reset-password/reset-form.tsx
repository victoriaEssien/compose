"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function ResetForm({ token }: { token: string | null }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && confirm !== password;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    setError(null);
    setPending(true);

    const { error: failure } = await authClient.resetPassword({ newPassword: password, token });

    if (failure) {
      setPending(false);
      setError(
        failure.message ??
          "That link has expired or has already been used. Ask for a new one from the sign-in page.",
      );
      return;
    }

    router.push("/sign-in");
    router.refresh();
  }

  if (!token) {
    return (
      <Card className="w-full">
        <CardHeader>
          <h1 className="font-display text-xl leading-none font-semibold">This link is incomplete</h1>
          <CardDescription>
            Reset links work once and expire after an hour. Ask for a fresh one and open it straight
            from the email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/sign-in">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <h1 className="font-display text-xl leading-none font-semibold">Choose a new password</h1>
        <CardDescription>You will be signed in with it from now on.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              autoComplete="new-password"
              aria-invalid={tooShort || undefined}
              aria-describedby="passwordHint"
              required
            />
            <p
              id="passwordHint"
              className={tooShort ? "text-destructive text-xs" : "text-muted-foreground text-xs"}
            >
              {tooShort ? "Too short. Use at least 8 characters." : "At least 8 characters."}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirm">Repeat it</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
              aria-invalid={mismatch || undefined}
              aria-describedby={mismatch ? "confirmError" : undefined}
              required
            />
            {mismatch && (
              <p id="confirmError" className="text-destructive text-xs">
                These two do not match yet.
              </p>
            )}
          </div>

          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}

          <Button type="submit" disabled={pending || tooShort || mismatch || password.length === 0}>
            {pending ? "Saving..." : "Save new password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
