# Compose: Agent Conventions

Read [`docs/spec.md`](docs/spec.md) for the product and [`tasks.md`](tasks.md) for what to build next. Check off tasks in `tasks.md` as you finish them.

## Commands

- Package manager: **pnpm** only. Don't add npm or yarn lockfiles.
- `pnpm dev` / `pnpm build` / `pnpm start`
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm format`
- `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`, `pnpm db:studio`
- shadcn components: `pnpm dlx shadcn@latest add <component>` (they land in `src/components/ui/`)

Before calling a task done: `pnpm typecheck && pnpm lint && pnpm test`.

## Architecture

The core rule: **AI decides WHAT, the renderer decides HOW.**

```text
User content → AI (src/server/ai) → PostSpec JSON → Zod validation (src/types) → Renderer (src/templates) → PNG
```

- The AI never produces pixels for anything containing important text. Image generation is only for illustrations, backgrounds, decorative elements and avatars.
- Every AI response is validated against a Zod schema before it is stored or rendered.
- Templates are deterministic: same slide data + same Brand Kit = same image.
- The in-app preview and the exported PNG use the same template code.

## Renderer

Slides are drawn by `next/og` (`ImageResponse`, built on Satori). Templates are JSX
with inline styles, in `src/templates/`. The same element paints the in-app preview
and the exported PNG, so they cannot drift.

What Satori accepts, and what it does not:

- Flexbox only. No grid, no float, no pseudo-elements. Every element with more than
  one child needs an explicit `display: flex`.
- Inline styles only. Tailwind classes never reach the renderer.
- Raw `<img>`, never `next/image`. ESLint is turned off for that rule under
  `src/templates/`.
- Fonts have to be handed over as raw bytes, so only the families in
  `fontFamilies` (`src/types/brand.ts`) can be used. Their TTFs live in
  `public/fonts/`, which also lets the browser preview load the same files through
  `@font-face`. Adding a family means adding its TTF there.
- Syntax highlighting is pre-tokenised by Shiki on the server
  (`src/server/render/highlight.ts`), because Satori cannot await anything.

Formats are 1080x1350 (carousel) and 1080x1080 (square). Per-slide overrides in
`designConfig` are merged over the Brand Kit by `slideTheme()`; templates read the
resolved theme, never the Brand Kit directly.

## Layout

```text
src/
  app/                  Routes (App Router)
    (auth)/             Sign-in and other public auth pages
    (app)/              Signed-in pages: dashboard, posts, brand, assets
    api/                Route handlers (auth, PNG rendering, uploads)
  components/
    ui/                 shadcn/ui primitives (generated, edit sparingly)
  lib/                  Client-safe helpers (cn, auth client)
  server/               Server-only code (import "server-only")
    ai/                 OpenAI wrapper, prompts, analyzer / structurer / planner
    db/                 Drizzle client and schema
    render/             PNG rendering and export
    storage/            Vercel Blob uploads
  templates/            Slide template registry and template components
  types/                Zod schemas and inferred types (PostSpec, BrandKit, ...)
docs/spec.md            Product spec
drizzle/                Generated migrations (don't hand-edit)
```

## Rules

- TypeScript strict. No `any` without a comment explaining why.
- Zod schemas are the source of truth for shared shapes; infer types from them.
- Anything touching the DB, secrets or OpenAI lives under `src/server/` and imports `server-only`.
- Read env through `env()` from `src/lib/env.ts`, not `process.env`, in server code.
- Prefer server components and server actions; add `"use client"` only where interaction needs it.
- Keep the editor lightweight. No drag-and-drop canvas editor (spec section 13).
- Respect the MVP boundary in spec section 23. Don't build publishing, scheduling, analytics or multi-platform features unless asked.
- UI copy: plain and direct, no em dashes.

## Before pushing

Run `/ai-slop-cleaner` over the branch diff before every push, then re-run
`pnpm typecheck && pnpm lint && pnpm test`.

- Comments say why, not what. Two lines maximum. Go longer only when the
  reasoning genuinely does not fit, which is rare.
- No comment that restates the line below it, no try/catch that only rethrows,
  no defensive branch for a case that cannot happen.

## Commits

Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`). One logical change per commit.
