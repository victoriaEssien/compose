"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { SettingsCard } from "./settings-card";

const options = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "Match my system", Icon: Monitor },
] as const;

export function Appearance() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // The server cannot know the OS preference, so nothing is marked selected
  // until the client has one. Otherwise the first paint disagrees with hydration.
  useEffect(() => setMounted(true), []);

  return (
    <SettingsCard
      title="Appearance"
      description="Applies to this app only. Your slides always use the colours in your Brand Kit."
    >
      <fieldset className="grid gap-2 sm:grid-cols-3">
        <legend className="sr-only">Theme</legend>
        {options.map(({ value, label, Icon }) => {
          const selected = mounted && theme === value;

          return (
            <label
              key={value}
              className={cn(
                "focus-within:ring-ring flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 text-sm transition-colors focus-within:ring-2",
                selected ? "border-primary bg-primary/5 font-medium" : "hover:bg-accent/60",
              )}
            >
              <input
                type="radio"
                name="theme"
                value={value}
                checked={selected}
                onChange={() => setTheme(value)}
                className="sr-only"
              />
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  selected ? "text-primary" : "text-muted-foreground",
                )}
                aria-hidden="true"
              />
              {label}
            </label>
          );
        })}
      </fieldset>
    </SettingsCard>
  );
}
