import { ArrowRight, Check, Download, Palette, PencilLine, Shapes } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/logo";
import { SlidePreview } from "@/components/slide-preview";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { currentUserId } from "@/server/auth";
import { sampleSlides } from "@/templates/fixtures";
import { brandPresets } from "@/types/brand";
import type { BrandKit, BrandPreset } from "@/types/brand";

/**
 * Not a Brand Kit anyone owns. Every slide on this page is drawn by the real
 * renderer from one of these, so the page shows actual product output rather
 * than a mockup of it. That is the whole argument the page is making, and a
 * screenshot would not be evidence of it.
 */
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

/** The same identity, wearing one of the presets a new account can pick. */
function kitFrom(preset: BrandPreset): BrandKit {
  return {
    ...demoKit,
    fonts: { ...preset.fonts },
    colors: { ...preset.colors },
    style: { ...preset.style },
  };
}

const deck = [sampleSlides.cover, sampleSlides.numbered_list, sampleSlides.code] as const;

const oldWay = [
  "Have an idea",
  "Write the content",
  "Open Canva or Figma",
  "Figure out a layout",
  "Design every slide",
  "Resize and fix spacing",
  "Export",
  "Post",
];

const newWay = ["Have an idea", "Paste it into Compose", "Review the carousel", "Export"];

const steps = [
  {
    title: "Paste what you already wrote",
    body: "A debugging story, a project update, three things you learned. Rough is fine. No formatting, no headings, no slide breaks.",
  },
  {
    title: "Compose decides the structure",
    body: "It reads the content, picks a post type, and plans the slides: which layout each one uses, where the hook goes, how the points build, where the CTA lands.",
  },
  {
    title: "Every slide is drawn, not imagined",
    body: "Layouts come from real templates, not an image model. The type is measured and fitted so your words always land inside the frame, and the text stays editable.",
  },
];

const features = [
  {
    Icon: Shapes,
    title: "Nine real layouts",
    body: "Cover, numbered list, code, comparison, quote, screenshot, project, text and closing CTA. Compose picks per slide, and you can change it.",
  },
  {
    Icon: Palette,
    title: "One Brand Kit, every post",
    body: "Fonts, colours, corner radius and voice. Change it once and every post you have made follows, including the ones from last month.",
  },
  {
    Icon: PencilLine,
    title: "The text stays text",
    body: "Nothing is baked into a picture. Fix a typo, shorten a line, recolour one slide, and it redraws.",
  },
  {
    Icon: Download,
    title: "Export ready to post",
    body: "Numbered PNGs at 1080x1350 or 1080x1080, zipped in order, with a caption and hashtags written for the post.",
  },
];

export default async function Home() {
  if (await currentUserId()) redirect("/dashboard");

  return (
    <div className="min-h-dvh">
      <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3 sm:px-8">
          <Logo />
          <nav className="text-muted-foreground ml-6 hidden items-center gap-6 text-sm md:flex">
            <a href="#how" className="hover:text-foreground transition-colors">
              How it works
            </a>
            <a href="#brand" className="hover:text-foreground transition-colors">
              Brand Kit
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-in">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-5 pt-14 pb-16 sm:px-8 sm:pt-20 sm:pb-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_minmax(0,1fr)] lg:gap-10">
            <div>
              <p className="border-primary/20 bg-primary/5 text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
                Your personal AI content designer
              </p>
              <h1 className="font-display mt-6 text-[2.5rem] leading-[1.03] font-semibold text-balance sm:text-6xl">
                You already wrote the post. Compose designs it.
              </h1>
              <p className="text-muted-foreground mt-6 max-w-xl text-lg leading-relaxed text-pretty">
                Paste a rough idea and get a branded Instagram carousel in minutes. Not a template
                you fill in, and not an image model guessing at text. Your writing, laid out
                properly.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/sign-in">
                    Start writing
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <p className="text-muted-foreground text-sm">Free while it is in the workshop.</p>
              </div>
            </div>

            {/*
              A deck rather than a row: three slides from one post, overlapping
              the way a carousel is actually read. On a phone the fan would be
              320px of unreadable slivers, so only the cover shows.
            */}
            <div className="flex justify-center lg:justify-end">
              <div className="flex -space-x-14 sm:-space-x-16">
                {deck.map((content, at) => (
                  <SlidePreview
                    key={content.template}
                    input={{ content, designConfig: null, imageUrl: null, index: at }}
                    brand={demoKit}
                    format="carousel"
                    total={deck.length}
                    assetUrls={new Map()}
                    width={224}
                    className={
                      [
                        "shadow-lift hidden translate-y-4 -rotate-6 sm:block",
                        "shadow-pop z-10",
                        "shadow-lift hidden translate-y-4 rotate-6 sm:block",
                      ][at]
                    }
                  />
                ))}
              </div>
            </div>
          </div>

          <p className="text-muted-foreground mt-10 text-center text-xs lg:text-left">
            Real slides, drawn by the same renderer that produces the exported PNGs.
          </p>
        </section>

        <section className="bg-surface border-y">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            <h2 className="font-display max-w-2xl text-3xl font-semibold text-balance sm:text-4xl">
              Writing the post was never the hard part.
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl text-pretty">
              The design step is where posting stops being consistent. It is the reason the idea you
              had on Tuesday is still a note on Friday.
            </p>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 sm:gap-12">
              <div className="bg-card/60 rounded-xl border border-dashed p-6">
                <p className="text-muted-foreground text-[0.6875rem] font-medium tracking-[0.1em] uppercase">
                  Without Compose
                </p>
                <ol className="mt-5 space-y-2.5">
                  {oldWay.map((step, at) => (
                    <li key={step} className="text-muted-foreground flex gap-3 text-sm">
                      <span
                        aria-hidden="true"
                        className="text-muted-foreground/40 w-4 shrink-0 text-right select-none"
                        data-numeric
                      >
                        {at + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-card shadow-card rounded-xl border p-6">
                <p className="text-primary text-[0.6875rem] font-medium tracking-[0.1em] uppercase">
                  With Compose
                </p>
                <ol className="mt-5 space-y-2.5">
                  {newWay.map((step, at) => (
                    <li key={step} className="flex gap-3 text-sm font-medium">
                      <span
                        aria-hidden="true"
                        className="text-primary/50 w-4 shrink-0 text-right select-none"
                        data-numeric
                      >
                        {at + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                <p className="text-muted-foreground mt-8 border-t pt-5 text-sm">
                  Four steps, and only the first one is yours.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16 sm:px-8 sm:py-24">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">How it works</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3 sm:gap-10">
            {steps.map((step, at) => (
              <div key={step.title} className="border-t pt-5">
                <p className="font-display text-primary text-sm font-semibold" data-numeric>
                  {String(at + 1).padStart(2, "0")}
                </p>
                <h3 className="font-display mt-3 text-base font-semibold text-balance">
                  {step.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed text-pretty">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="brand" className="bg-surface scroll-mt-20 border-y">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-semibold text-balance sm:text-4xl">
                Every post should look like it came from the same account.
              </h2>
              <p className="text-muted-foreground mt-4 text-pretty">
                Your Brand Kit holds the fonts, colours, corner radius and voice. Compose reads it
                on every generation, so a carousel you make tonight sits beside one you made last
                month without anyone noticing the gap.
              </p>
            </div>

            {/* One slide, one set of words, three saved looks. Same renderer each time. */}
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {brandPresets.slice(0, 3).map((preset) => (
                <figure key={preset.id} className="flex flex-col items-center gap-3">
                  <SlidePreview
                    input={{
                      content: sampleSlides.cover,
                      designConfig: null,
                      imageUrl: null,
                      index: 0,
                    }}
                    brand={kitFrom(preset)}
                    format="carousel"
                    total={1}
                    assetUrls={new Map()}
                    width={232}
                    className="shadow-lift"
                  />
                  <figcaption className="text-center">
                    <span className="block text-sm font-medium">{preset.name}</span>
                    <span className="text-muted-foreground block text-xs text-pretty">
                      {preset.description}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="text-muted-foreground mt-8 text-center text-xs">
              The same slide, three of the looks a new account starts with. Pick one and change
              anything.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">What you get</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {features.map(({ Icon, title, body }) => (
              <div key={title} className="bg-card shadow-card rounded-xl border p-6">
                <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                <h3 className="font-display mt-4 text-base font-semibold">{title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed text-pretty">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 sm:pb-28">
          <div className="bg-foreground text-background relative overflow-hidden rounded-2xl px-6 py-14 text-center sm:px-12">
            <h2 className="font-display mx-auto max-w-2xl text-3xl font-semibold text-balance sm:text-4xl">
              Turn the notes you wrote tonight into tomorrow&rsquo;s post.
            </h2>
            <p className="text-background/70 mx-auto mt-4 max-w-md text-pretty">
              Set up your Brand Kit once. After that it is paste, review, export.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-background text-foreground hover:bg-background/90 mt-8"
            >
              <Link href="/sign-in">
                Create your first carousel
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <p className="text-background/60 mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5" aria-hidden="true" />
                No credit card
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5" aria-hidden="true" />
                Your text stays editable
              </span>
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm sm:px-8">
          <Logo />
          <Link href="/sign-in" className="hover:text-foreground transition-colors">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
