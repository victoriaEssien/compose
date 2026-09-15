import Link from "next/link";
import { redirect } from "next/navigation";

import { SlidePreview } from "@/components/slide-preview";
import { Button } from "@/components/ui/button";
import { currentUserId } from "@/server/auth";
import { sampleSlides } from "@/templates/fixtures";
import type { BrandKit } from "@/types/brand";

/**
 * Not a Brand Kit anyone owns. The three slides below are drawn by the real
 * renderer from this kit, so the page shows the actual product output rather
 * than a mockup of it.
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

const showcase = [sampleSlides.cover, sampleSlides.numbered_list, sampleSlides.code] as const;

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

export default async function Home() {
  if (await currentUserId()) redirect("/dashboard");

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold tracking-tight">Compose</span>
        <Button asChild variant="ghost" size="sm">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-20 sm:pt-16">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
          Your personal AI content designer
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
          You already wrote the post. Compose designs it.
        </h1>
        <p className="text-muted-foreground mt-6 max-w-xl text-lg leading-relaxed text-pretty">
          Paste a rough idea and get a branded Instagram carousel in minutes. Not a template you
          fill in, and not an image model guessing at text. Your writing, laid out properly.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href="/sign-in">Start writing</Link>
          </Button>
          <p className="text-muted-foreground text-sm">Free while it is in the workshop.</p>
        </div>

        <div className="mt-16 flex flex-wrap justify-center gap-5 sm:mt-20 sm:justify-start">
          {showcase.map((content, at) => (
            <SlidePreview
              key={content.template}
              input={{ content, designConfig: null, imageUrl: null, index: at }}
              brand={demoKit}
              format="carousel"
              total={showcase.length}
              assetUrls={new Map()}
              width={248}
            />
          ))}
        </div>
        <p className="text-muted-foreground mt-5 text-xs">
          Three real slides, drawn by the same renderer that produces the exported PNGs.
        </p>
      </section>

      <section className="border-y">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Writing the post was never the hard part.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl text-pretty">
            The design step is where posting stops being consistent. It is the reason the idea you
            had on Tuesday is still a note on Friday.
          </p>

          <div className="mt-12 grid gap-10 sm:grid-cols-2 sm:gap-16">
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-[0.14em] uppercase">
                Without Compose
              </p>
              <ol className="mt-5 space-y-2.5">
                {oldWay.map((step) => (
                  <li key={step} className="text-muted-foreground flex gap-3 text-sm">
                    <span aria-hidden="true" className="text-muted-foreground/40 select-none">
                      /
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <p className="text-xs font-medium tracking-[0.14em] uppercase">With Compose</p>
              <ol className="mt-5 space-y-2.5">
                {newWay.map((step) => (
                  <li key={step} className="flex gap-3 text-sm font-medium">
                    <span aria-hidden="true" className="text-muted-foreground/40 select-none">
                      /
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <p className="text-muted-foreground mt-6 text-sm">
                Four steps, and only the first one is yours.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>
        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          {steps.map((step, at) => (
            <div key={step.title}>
              <p className="text-muted-foreground font-mono text-sm">
                {String(at + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 font-medium text-balance">{step.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed text-pretty">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Every post should look like it came from the same account.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl text-pretty">
            Your Brand Kit holds the fonts, colors, corner radius and voice. Compose reads it on
            every generation, so a carousel you make tonight sits beside one you made last month
            without anyone noticing the gap.
          </p>
          <Button asChild size="lg" className="mt-9">
            <Link href="/sign-in">Create your first carousel</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm">
          <span>Compose</span>
          <Link href="/sign-in" className="hover:text-foreground transition-colors">
            Sign in
          </Link>
        </div>
      </footer>
    </main>
  );
}
