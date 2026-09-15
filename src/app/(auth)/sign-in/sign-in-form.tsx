"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";

type Mode = "sign-in" | "sign-up";

const copy = {
  "sign-in": { title: "Welcome back", action: "Sign in", pending: "Signing in" },
  "sign-up": { title: "Create your account", action: "Create account", pending: "Creating" },
} satisfies Record<Mode, { title: string; action: string; pending: string }>;

export function SignInForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [forgot, setForgot] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    if (forgot) {
      const { error: failure } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

      setPending(false);
      // Reported the same either way, so this cannot be used to test addresses.
      if (failure) setError("Could not send the email just now. Try again in a moment.");
      else setSent(true);
      return;
    }

    const { error: failure } =
      mode === "sign-up"
        ? await authClient.signUp.email({ email, password, name: String(form.get("name") ?? "") })
        : await authClient.signIn.email({ email, password });

    if (failure) {
      setPending(false);
      setError(failure.message ?? "That did not work. Check your details and try again.");
      return;
    }

    // A new account has a placeholder Brand Kit, and every slide is signed with
    // it, so that is the first thing worth doing rather than the fourth.
    router.push(mode === "sign-up" ? "/brand?welcome=1" : "/dashboard");
    router.refresh();
  }

  function switchMode(value: string) {
    setMode(value as Mode);
    setForgot(false);
    setSent(false);
    setError(null);
  }

  const title = forgot ? "Reset your password" : copy[mode].title;

  const fields = (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
      {mode === "sign-up" && !forgot && (
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" autoComplete="name" required />
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      {!forgot && (
        <div className="grid gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="password">Password</Label>
            {mode === "sign-in" && (
              <button
                type="button"
                onClick={() => {
                  setForgot(true);
                  setError(null);
                }}
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-sm text-xs underline underline-offset-4 focus-visible:ring-2 focus-visible:outline-none"
              >
                Forgot password?
              </button>
            )}
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={8}
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            required
          />
          {mode === "sign-up" && (
            <p className="text-muted-foreground text-xs">At least 8 characters.</p>
          )}
        </div>
      )}

      {forgot && (
        <p className="text-muted-foreground text-sm">
          We will send a link that lets you choose a new password. It works once and expires in an
          hour.
        </p>
      )}

      {sent && (
        <p role="status" className="text-sm">
          If that address has an account, the link is on its way. Check your inbox.
        </p>
      )}

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending || sent}>
        {pending
          ? forgot
            ? "Sending..."
            : `${copy[mode].pending}...`
          : forgot
            ? "Send reset link"
            : copy[mode].action}
      </Button>

      {forgot && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setForgot(false);
            setSent(false);
            setError(null);
          }}
        >
          Back to sign in
        </Button>
      )}
    </form>
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <h1 className="leading-none font-semibold">{title}</h1>
        <CardDescription>Compose turns your rough notes into on-brand posts.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={mode} onValueChange={switchMode}>
          <TabsList className="w-full">
            <TabsTrigger value="sign-in">Sign in</TabsTrigger>
            <TabsTrigger value="sign-up">Create account</TabsTrigger>
          </TabsList>

          {/* The form lives inside a panel, so each trigger's aria-controls resolves. */}
          <TabsContent value="sign-in">{fields}</TabsContent>
          <TabsContent value="sign-up">{fields}</TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
