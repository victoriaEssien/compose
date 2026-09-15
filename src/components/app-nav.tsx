"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/posts/new", label: "Create post" },
  { href: "/brand", label: "Brand Kit" },
  { href: "/assets", label: "Assets" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="-mx-1 flex [scrollbar-width:none] items-center gap-1 overflow-x-auto px-1 sm:overflow-visible [&::-webkit-scrollbar]:hidden">
      {links.map(({ href, label }) => {
        // Exact for /posts/new, prefix elsewhere, so /brand/anything still lights up.
        const active = href === "/posts/new" ? pathname === href : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-visible:ring-ring flex items-center rounded-md px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
