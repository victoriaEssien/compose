import Link from "next/link";

import { Logo } from "@/components/logo";
import { SlidePreview } from "@/components/slide-preview";
import { sampleSlides } from "@/templates/fixtures";
import type { BrandKit } from "@/types/brand";

/** The same demo identity the landing page uses, so the two pages agree. */
const demoKit: BrandKit = {
  name: "The Codebreaker",
  username: "@thecodebreaker",
  logoUrl: null,
  avatarUrl: null,
  fonts: { primary: "Space Grotesk", secondary: "IBM Plex Sans" },
  colors: { background: "#0B0B0F", text: "#F5F5F7", accent: "#6E56CF", muted: "#8A8A96" },
  style: { radius: 16, card: "flat", illustration: "line", codeBlock: "dark" },
  voice: null,
};

/**
 * Sign-in and password reset share this. The panel on the left is not
 * decoration: it is a slide the renderer drew, which is the one claim the
 * product has to make before anyone will hand over an email address.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-2">
      <aside className="bg-foreground text-background relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <Link
          href="/"
          className="focus-visible:ring-background/60 w-fit rounded-md focus-visible:ring-2 focus-visible:outline-none"
        >
          <Logo markClassName="text-background" />
          <span className="sr-only">Compose home</span>
        </Link>

        <div className="flex justify-center py-8">
          <SlidePreview
            input={{
              content: sampleSlides.cover,
              designConfig: null,
              imageUrl: null,
              index: 0,
            }}
            brand={demoKit}
            format="carousel"
            total={3}
            assetUrls={new Map()}
            width={296}
            className="shadow-pop border-white/10"
          />
        </div>

        <div className="max-w-sm">
          <p className="font-display text-xl leading-snug font-semibold text-balance">
            You already wrote the post. Compose designs it.
          </p>
          <p className="text-background/60 mt-3 text-sm leading-relaxed text-pretty">
            Paste a rough idea and get a branded carousel in minutes. The slide above was drawn by
            the same renderer that produces the exported PNGs.
          </p>
        </div>
      </aside>

      <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-10 sm:px-8">
        <Link
          href="/"
          className="focus-visible:ring-ring mb-8 rounded-md focus-visible:ring-2 focus-visible:outline-none lg:hidden"
        >
          <Logo />
          <span className="sr-only">Compose home</span>
        </Link>
        {children}
      </main>
    </div>
  );
}
