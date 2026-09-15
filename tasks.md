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

- [ ] OpenAI client wrapper in `src/server/ai/` behind a small provider interface
- [ ] Structured output helper: call model with a Zod schema, validate, retry once on invalid output, surface a clean error
- [ ] Content Analyzer (spec section 17): topic, audience, tone, post type, complexity, suggested slide count
- [ ] Content Structurer: hook, body, supporting points, conclusion, CTA
- [ ] Design Planner: slide count, template per slide, visual suggestion, text hierarchy. Must only use registered templates
- [ ] Prompts live in versioned files in `src/server/ai/prompts/`, include Brand Kit + brand voice
- [ ] Text length limits per template enforced in the schema (no overcrowded slides)
- [ ] `generatePost(input, brand)` orchestration: analyze → structure → plan → validated `PostSpec`
- [ ] Tests with mocked model responses (valid, invalid, retry)

## Phase 5: Create Post flow

- [ ] Create Post page (spec section 22): content textarea, optional context, post type select (Auto default), tone select
- [ ] Server action: validate input, run `generatePost`, persist `post` + `slide` rows as a draft, redirect to `/posts/[postId]`
- [ ] Loading / progress state during generation
- [ ] Error handling: AI failure, validation failure, empty input

## Phase 6: Renderer, templates, preview, export

- [ ] Confirm renderer approach (see Decisions below) and document it in `AGENTS.md`
- [ ] Template registry in `src/templates/`: id, name, Zod content schema, text limits, render function `(slide, brand, format) => JSX`
- [ ] Templates (MVP needs 5 to 8): Cover, Text, Numbered List, Code, Comparison, Quote, Screenshot/Project, Final Slide (CTA)
- [ ] Shared brand primitives: background, typography scale, avatar/username footer, slide counter, code block style
- [ ] Font loading for the renderer (bundle TTF/OTF files for Brand Kit fonts)
- [ ] Formats: carousel 1080 × 1350 and square 1080 × 1080
- [ ] PNG render route: `GET /api/posts/[postId]/slides/[slideId]/png`
- [ ] In-app preview using the same template code, scaled to fit
- [ ] Slide carousel viewer on `/posts/[postId]` (spec section 22)
- [ ] Export: download one slide, download all slides as a ZIP
- [ ] Snapshot/visual tests for each template with fixture data

## Phase 7: Editor and regeneration

- [ ] Edit slide text inline or in a side panel (spec section 13)
- [ ] Reorder, duplicate and delete slides
- [ ] Change template for a slide (re-map content fields where possible)
- [ ] Change visual (asset picker or suggested icon)
- [ ] Adjust font size and colors per slide (overrides stored in `designConfig`)
- [ ] Edit CTA
- [ ] Regenerate single slide with options (spec section 14): rewrite, shorter, clearer, funnier, more technical, change layout, another design, free-text instruction
- [ ] Regeneration changes only the target slide and keeps the rest of the post intact
- [ ] Autosave edits to the draft

## Phase 8: Drafts, polish, deploy

- [ ] Drafts list and resume editing from the dashboard
- [ ] Mark post as ready / exported
- [ ] Track time from post created to first export (spec section 34 primary metric)
- [ ] Track generated vs exported posts (spec section 34 secondary metric)
- [ ] Responsive pass and accessibility pass
- [ ] Deploy to Vercel, set env vars, run migrations
- [ ] Dogfood: create 3 real carousels end to end in under 5 minutes each

---

## Decisions to confirm

- [ ] **Renderer.** Proposed: `next/og` (`ImageResponse`, built on Satori) with templates written as JSX + inline styles. No extra dependency, runs on Vercel. Limits: flexbox-only layout, subset of CSS, fonts must be loaded as TTF/OTF, code highlighting must be pre-tokenised. Alternative: headless Chromium screenshots (full CSS, heavier, harder on Vercel).
- [x] **Sign-in methods** for Better Auth. Decided: email and password only. No OAuth app to register and Better Auth keeps users in our own Postgres. GitHub or magic links can be added later without a migration.
- [ ] **Image generation** model and where it's allowed (illustrations, backgrounds, avatars only; never text).
- [ ] **Code highlighting** library for the Code template (e.g. Shiki, tokens rendered as spans).

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
