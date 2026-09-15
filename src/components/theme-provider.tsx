"use client";

import { ThemeProvider as NextThemes } from "next-themes";

/**
 * `globals.css` has carried a complete dark palette since Phase 0 and nothing
 * ever applied `.dark`, so a user on a dark OS got a white app whose default
 * Brand Kit is near-black. `next-themes` was already a dependency, imported only
 * by the Toaster.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemes>
  );
}
