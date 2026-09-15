"use client";

import { ChevronsUpDown, LogOut, Monitor, Moon, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

const themes = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const;

export type SessionUser = { name: string; email: string; image: string | null };

/**
 * Who you are, and everything that is about you rather than about the work:
 * account settings, appearance, sign out. Keeping these out of the main nav is
 * what lets the nav be only the three places your posts live.
 */
export function UserMenu({ user }: { user: SessionUser }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // The server cannot know the OS preference, so no tick is drawn until the
  // client has one. Otherwise the first paint disagrees with hydration.
  useEffect(() => setMounted(true), []);

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-accent/60 focus-visible:ring-ring flex w-full cursor-pointer items-center gap-2.5 rounded-lg p-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none">
        <Avatar name={user.name} email={user.email} image={user.image} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{user.name || "Your account"}</span>
          <span className="text-muted-foreground block truncate text-xs">{user.email}</span>
        </span>
        <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
        <span className="sr-only">Open account menu</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="top" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-medium">{user.name || "Your account"}</span>
          <span className="text-muted-foreground block truncate text-xs">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="size-4" />
            Account settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
          Appearance
        </DropdownMenuLabel>
        {themes.map(({ value, label, Icon }) => (
          <DropdownMenuItem
            key={value}
            onSelect={() => setTheme(value)}
            aria-current={mounted && theme === value ? "true" : undefined}
          >
            <Icon className="size-4" />
            {label}
            {mounted && theme === value && (
              <span aria-hidden="true" className="bg-primary ml-auto size-1.5 rounded-full" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={signingOut} onSelect={signOut}>
          <LogOut className="size-4" />
          <span aria-live="polite">{signingOut ? "Signing out..." : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
