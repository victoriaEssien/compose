# Compose: Build Tasks

Product spec: [`docs/spec.md`](docs/spec.md). Conventions: [`AGENTS.md`](AGENTS.md).

**How to use this file (for Claude):** work top to bottom unless told otherwise. When a task is complete and `pnpm typecheck`, `pnpm lint` and `pnpm test` pass, change its `[ ]` to `[x]` in the same change. If a task turns out to need splitting, add sub-tasks under it rather than deleting it. Don't start Backlog items unless asked.

---

## Phase 0: Setup

- [x] Next.js 15 (App Router, `src/`, Turbopack dev) + TypeScript + ESLint
- [x] Tailwind CSS v4 + shadcn/ui config (`components.json`, `cn()`, theme tokens, `Button`)
- [x] Dependencies installed: Drizzle, Neon driver, Better Auth, OpenAI SDK, Zod, Vercel Blob, lucide-react
- [x] `drizzle.config.ts`, lazy DB client (`src/server/db/client.ts`), empty schema
- [x] Typed env access (`src/lib/env.ts`) and `.env.example`
- [x] Prettier (+ Tailwind plugin), Vitest, CI workflow
- [x] Placeholder routes: `/`, `/sign-in`, `/dashboard`, `/posts/new`, `/posts/[postId]`, `/brand`, `/assets`, `/api/health`
- [x] Spec in `docs/spec.md`, this task list
- [x] `pnpm install`, `git init`, first commit, push to GitHub (personal account)
- [x] Create a Postgres database (Neon) and fill in `.env.local`
- [x] Create a Vercel Blob store and add `BLOB_READ_WRITE_TOKEN` (public access, iad1)
- [x] Add the shadcn components needed early: `pnpm dlx shadcn@latest add input textarea label select card dialog dropdown-menu tabs sonner skeleton`

## Phase 1: Data model and shared schemas

- [x] Drizzle tables for `brand`, `asset`, `post`, `slide`, `template` (spec section 25), with `jsonb` for fonts, colors, generatedContent, content, designConfig, configuration
- [x] Enums: post type (spec section 8 + `auto`), post status (`draft`, `ready`, `exported`), template kind (spec section 11), asset type
- [x] Indexes on `userId` and `(postId, order)`
- [x] Zod schemas in `src/types/`: `BrandKit`, `PostSpec` (structured post JSON, spec sections 12 and 26), `SlideSpec` as a discriminated union on `template`
- [x] Derive TS types from the Zod schemas (single source of truth)
- [x] Generate and apply the first migration (`pnpm db:generate`, `pnpm db:migrate`)
- [x] Unit tests for `PostSpec` validation (valid, missing fields, unknown template, overlong text)

## Phase 2: Authentication

- [x] Better Auth server config (`src/server/auth.ts`) with the Drizzle adapter
- [x] Better Auth tables (`user`, `session`, `account`, `verification`) in the schema; migrate. `@better-auth/cli` is deprecated and pinned to 1.4.x, so they were derived from `getAuthTables()` in the installed better-auth instead
- [x] Route handler at `src/app/api/auth/[...all]/route.ts`
- [x] Client helper (`src/lib/auth-client.ts`)
- [x] Sign-in page: email and password, with a Create account tab
- [x] Protect `(app)` routes (layout guard in `(app)/layout.tsx`) and add `currentUserId()` / `requireUserId()`
- [x] Sign-out

## Phase 3: App shell, Dashboard, Brand Kit, Assets

- [x] App navigation in `(app)/layout.tsx`: Dashboard, Create Post, Brand Kit, Assets
- [x] Dashboard (spec section 21): Create Post button, Recent Posts, Drafts, Brand Kit link. No analytics
- [x] Empty states for no posts / no brand kit
- [x] Brand Kit form (spec section 10): name, username, logo, avatar, fonts, colors, radius, card style, illustration style, code block style
- [x] Brand voice field (spec section 27)
- [x] Seed a default Brand Kit on first sign-in (Better Auth `user.create.after` hook)
- [x] Live brand preview using a sample slide. Stubbed with plain CSS until the Phase 6 renderer exists
- [x] Upload service (`src/server/storage/`) wrapping Vercel Blob: type and size limits, per-user paths
- [x] Assets page (spec section 16): upload, list, rename, delete
- [x] Asset picker component, used by the Brand Kit logo and avatar fields and reusable in the editor

## Phase 4: AI pipeline

- [x] OpenAI client wrapper in `src/server/ai/` behind a small provider interface
- [x] Structured output helper: call model with a Zod schema, validate, retry once on invalid output, surface a clean error
- [x] Content Analyzer (spec section 17): topic, audience, tone, post type, complexity, suggested slide count
- [x] Content Structurer: hook, body, supporting points, conclusion, CTA
- [x] Design Planner: slide count, template per slide, visual suggestion, text hierarchy. Must only use registered templates
- [x] Prompts live in versioned files in `src/server/ai/prompts/`, include Brand Kit + brand voice
- [x] Text length limits per template enforced in the schema (no overcrowded slides)
- [x] `generatePost(input, brand)` orchestration: analyze → structure → plan → validated `PostSpec`
- [x] Tests with mocked model responses (valid, invalid, retry)

## Phase 5: Create Post flow

- [x] Create Post page (spec section 22): content textarea, optional context, post type select (Auto default), tone select
- [x] Server action: validate input, run `generatePost`, persist `post` + `slide` rows as a draft, redirect to `/posts/[postId]`
- [x] Loading / progress state during generation
- [x] Error handling: AI failure, validation failure, empty input

## Phase 6: Renderer, templates, preview, export

- [x] Confirm renderer approach (see Decisions below) and document it in `AGENTS.md`
- [x] Template registry in `src/templates/`: id, name, Zod content schema, text limits, render function `(slide, brand, format) => JSX`
- [x] Templates (MVP needs 5 to 8): Cover, Text, Numbered List, Code, Comparison, Quote, Screenshot/Project, Final Slide (CTA)
- [x] Shared brand primitives: background, typography scale, avatar/username footer, slide counter, code block style
- [x] Font loading for the renderer (bundle TTF/OTF files for Brand Kit fonts)
- [x] Formats: carousel 1080 × 1350 and square 1080 × 1080
- [x] PNG render route: `GET /api/posts/[postId]/slides/[slideId]/png`
- [x] In-app preview using the same template code, scaled to fit
- [x] Slide carousel viewer on `/posts/[postId]` (spec section 22)
- [x] Export: download one slide, download all slides as a ZIP
- [x] Snapshot/visual tests for each template with fixture data

## Phase 7: Editor and regeneration

- [x] Edit slide text inline or in a side panel (spec section 13)
- [x] Reorder, duplicate and delete slides
- [x] Change template for a slide (re-map content fields where possible)
- [x] Change visual (asset picker or suggested icon)
- [x] Adjust font size and colors per slide (overrides stored in `designConfig`)
- [x] Edit CTA
- [x] Regenerate single slide with options (spec section 14): rewrite, shorter, clearer, funnier, more technical, change layout, another design, free-text instruction
- [x] Regeneration changes only the target slide and keeps the rest of the post intact
- [x] Autosave edits to the draft

## Phase 8: Drafts, polish, deploy

- [x] Drafts list and resume editing from the dashboard
- [x] Mark post as ready / exported (downloading marks it exported)
- [x] Track time from post created to first export (spec section 34 primary metric)
- [x] Track generated vs exported posts (spec section 34 secondary metric)
- [x] Responsive pass and accessibility pass
- [x] Deploy to Vercel, set env vars, run migrations. Migrations apply automatically through `pnpm vercel-build`
- [x] Dogfood: create 3 real carousels end to end in under 5 minutes each

## Phase 9: UI/UX review round 1

A full `/impeccable critique` of the signed-in app scored it **20/40** on
Nielsen's heuristics with cognitive load HIGH, 3 P0 issues and 2 P1 issues. The
remediation plan lives in [`review-round1.md`](review-round1.md), split into 11
rounds plus 8 decisions that need an answer before their work starts.

Note on Phase 8 above: "Responsive pass and accessibility pass" is ticked and
that work was real (every form field is labelled, there are zero raw `<img>`
tags, 12 of 14 server actions have pending state). It stopped before contrast,
focus rings, touch targets, motion and error association, and the editor still
overflows at 390px. Rounds 7 and 8 of `review-round1.md` finish it.

- [x] Round 1: stop losing user work (autosave flush, confirmations, undo)
- [x] Round 2: the front door (landing redirect, `@yourhandle` in exports, first run)
- [x] Round 3: show the work (thumbnails, filmstrip, template grid, export completion)
- [x] Round 4: the Brand Kit (real preview, starter palettes, contrast check)
- [x] Round 5: the generation wait (stage reporting, skeleton, cancel)
- [x] Round 6: states and error routes (`error.tsx`, `loading.tsx`, `not-found.tsx`)
- [x] Round 7: accessibility (contrast tokens, error association, targets, motion)
- [x] Round 8: responsive (390px editor overflow, mobile nav, `md:` step)
- [ ] Round 9: performance (refresh storm, woff2 subsets, throttling)
- [ ] Round 10: consistency, copy and hierarchy
- [ ] Round 11: editor efficiency (keyboard nav, format persistence, breadcrumb)

---

## Decisions to confirm

- [x] **Renderer.** Decided: `next/og` (Satori), documented in `AGENTS.md`. Templates are flexbox JSX with inline styles, fonts ship as TTFs in `public/fonts/`.
- [x] **Sign-in methods** for Better Auth. Decided: email and password only. No OAuth app to register and Better Auth keeps users in our own Postgres. GitHub or magic links can be added later without a migration.
- [x] **Image generation.** Decided: `gpt-image-1-mini`, transparent PNG, for the `visual` hint only and never automatically. Bundled icons cover the common hints; generation is a per-slide action in the editor.
- [x] **Code highlighting.** Decided: Shiki, tokenised on the server and drawn as coloured spans.

## Backlog (post-MVP, do not start unless asked)

- [ ] Save a generated design as a reusable template (spec section 15)
- [ ] Caption, CTA and hashtag generation (spec section 20)
- [ ] Instagram publishing via official Meta APIs (spec sections 19, 31)
- [ ] Scheduling
- [ ] Personal content memory and series detection (spec section 28)
- [ ] Content ideas (spec section 29)
- [ ] GitHub integration (spec section 30)
- [ ] More formats: Stories, Reels covers, LinkedIn, X (spec section 18)
- [ ] Multi-platform adaptation (spec section 32)
