"use client";

import { Images, LayoutGrid, Palette } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Posts", Icon: LayoutGrid },
  { href: "/brand", label: "Brand Kit", Icon: Palette },
  { href: "/assets", label: "Assets", Icon: Images },
];

/** True for /brand and /brand/anything, false for /brandish. */
function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-0.5">
      {links.map(({ href, label, Icon }) => {
        // The editor lives under /posts/:id but belongs to the Posts list.
        const active =
          isActive(pathname, href) || (href === "/dashboard" && pathname.startsWith("/posts/"));

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-visible:ring-ring relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
              active
                ? "bg-card text-foreground shadow-card font-medium"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "opacity-70")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
