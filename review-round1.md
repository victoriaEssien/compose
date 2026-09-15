# Review Round 1: UI/UX remediation

Source: `/impeccable critique` of the whole signed-in app, 2026-09-15. Raw
assessments in [`.impeccable/critique/critique2.md`](.impeccable/critique/critique2.md),
condensed snapshot in
[`.impeccable/critique/2026-09-15T14-06-18Z__src-app.md`](.impeccable/critique/2026-09-15T14-06-18Z__src-app.md).

Score at the time of review: **Nielsen 20/40**, cognitive load **HIGH** (6 of 8
checks fail), 3 P0 and 2 P1 priority issues.

Headline verdict: the slide renderer is genuinely well authored, the app around
it is interchangeable shadcn CRUD. Every issue below is one of three things:
work the app destroys, a decision the app hides, or a promise the app makes and
does not keep.

**How to use this file:** same rules as [`tasks.md`](tasks.md). Work a round top
to bottom, tick `[ ]` to `[x]` in the same change as the work, and run
`pnpm typecheck && pnpm lint && pnpm test` before calling anything done. Items
marked **[BLOCKED]** wait on an answer in [Decisions needed](#decisions-needed).

Every line carries the file and line number the reviewers cited so nothing has
to be rediscovered. Line numbers are as of commit `ee775a8`.

---

## Round 1: stop losing user work

The editor destroys work in three separate ways and has no undo anywhere. This
is a tool for refining copy, so this round comes first.

**Status: done.** `pnpm typecheck`, `pnpm lint` and `pnpm test` (218 passing) all
green.

### 1.1 Autosave truthfulness

- [x] Hoist the debounced save payload into a ref so it can be flushed on demand (`post-editor.tsx:96-116`)
- [x] Flush the pending save synchronously inside `setActive` before switching slides (`post-editor.tsx:115`, `editor-state.ts:43`)
- [x] Flush the pending save at the top of `run()` so every action sees current text (`post-editor.tsx:126-135`)
- [x] Add a `beforeunload` guard while the draft signature differs from the server signature (`editor-state.ts:22-47` already computes both)
- [x] Stop `run()` wiping the autosave status to `""` mid-flight (`post-editor.tsx:131`)
- [x] Give an autosave failure a retry affordance and a persistent "not saved" state, not a message that scrolls past (`post-editor.tsx:251-257`)
- [x] Keep `shouldAutosave`'s cross-slide guard exactly as it is. It is correct and unit-tested; only the flush was missing (`editor-state.ts:38-47`)

A flush that fails now aborts whatever asked for it. Switching slides with an
unsaved edit that will not save keeps you on the slide, showing the error and a
retry, instead of moving on and dropping the text.

### 1.2 Destructive actions

- [x] `pnpm dlx shadcn@latest add alert-dialog`
- [x] Confirm slide delete, naming the slide and its template ("Delete slide 3, the Comparison slide?") (`post-editor.tsx:232-239`)
- [x] Confirm asset delete. It deletes the blob too, so it is unrecoverable (`asset-list.tsx:81-84`)
- [x] Warn before regenerate that it replaces this slide's text, reusing the sentence pattern already at `post-editor.tsx:386-388`
- [x] Make regenerate read the flushed client content, not stale database rows (`actions.ts:149-172`)
- [x] Slide Delete now uses `variant="destructive"`, matching asset Delete (was one of the Round 10.3 inconsistencies, fixed here because the button was being rewritten anyway)

### 1.3 Undo

- [x] Mount `<Toaster />` in `(app)/layout.tsx`. `sonner` is installed and `ui/sonner.tsx` is fully configured but `<Toaster />` is mounted nowhere and `toast()` is called nowhere
- [x] Undo on slide delete via a client-held snapshot or a soft delete
- [x] Undo on regenerate. `actions.ts:144` already holds `target.content` in hand
- [x] Undo on template change. `remapSlide` is lossy and the change is currently blind and immediate (`post-editor.tsx:264-280`)

Delete undo went the client-snapshot route rather than a soft delete, so it
needs no migration. New `insertSlideAt` in `server/slides.ts` and
`restoreSlideAction` put the slide back at its original index. `deleteSlide`
never touched the blob, so a restored slide keeps its generated illustration.

### 1.4 Missing pending states

- [x] Disable the template `SelectTrigger` while busy. It is the only control in the editor not gated (`post-editor.tsx:270`)
- [x] Give asset delete a pending state. The `DropdownMenuItem` shows nothing while the blob deletes (`asset-list.tsx:82`)
- [x] Give illustration generation its own busy flag instead of sharing `busy` with every other action, which makes unrelated buttons read "Working..." (`post-editor.tsx:299`)

Every action now passes its own label through `run()`, so the live region reads
"Reordering...", "Generating illustration...", "Undoing..." and so on rather
than one shared "Working".

---

## Round 2: the front door

Three separate first impressions are broken, and two of them ship a defect into
a file the user downloads.

**Status: done.** `pnpm typecheck`, `pnpm lint` and `pnpm test` (223 passing,
5 new) all green.

### 2.1 Landing page

- [x] Replace the placeholder at `/` with a redirect: signed in to `/dashboard`, otherwise `/sign-in` (`src/app/page.tsx:8-16`). It currently ships the string "Boilerplate is ready; see tasks.md to start building" to production
- [x] Build the real landing page. **D7 was answered "build it"**, so `/` is now a Persuade surface: the spec section 2 before/after as two columns, how it works, and the Brand Kit promise. Signed-in visitors still redirect to `/dashboard`

The three slides in the hero are **real renderer output**, not screenshots. They
come from `templates/fixtures.ts` through `SlidePreview` with a demo Brand Kit
defined in the page, so the landing page cannot show something the product does
not actually produce.

### 2.2 The placeholder handle in exported PNGs

`defaultBrandKit.username` is `"@yourhandle"` (`types/brand.ts:73`) and `Frame`
draws it in the footer of every slide (`primitives.tsx:71-83`). Nothing checks.
A new user's first carousel exports with it burned into all six PNGs.

- [x] Rewrite `isDefaultBrandKit` to deep-compare the whole kit. It currently compares only `name` and `username`, so a fully configured kit whose name is still "Your brand" reports as not set up (`types/brand.ts:83-85`)
- [x] Warn, do not block, on `/posts/new` when the kit is still seeded: "Your posts will be signed @yourhandle"
- [x] Block the export routes on a still-default `username`, or substitute the account name (`api/posts/[postId]/export/route.ts`, `api/posts/[postId]/slides/[slideId]/png/route.ts`)
- [x] Redirect new users to `/brand` once after sign-up. Better Auth already seeds the kit in the `user.create.after` hook
- [x] Pulled forward from Round 3.6: the single-slide PNG route no longer calls `markExported`. Downloading one slide is how you inspect it, and inspecting a draft should not move it out of Drafts

Blocking beat substituting the account name: a substituted handle is still not
the handle you meant, and you would not find out until the PNGs were on disk.
Both routes return 409 with a plain sentence. New `hasPlaceholderHandle` is
checked separately from `isDefaultBrandKit`, because the handle is the only
field that makes a downloaded file unpublishable. Both are unit-tested in
`src/types/brand.test.ts`.

### 2.3 First run

- [x] Order the dashboard's two competing CTAs. Brand Kit should come before first post, and nothing currently says so (`dashboard/page.tsx:79-103`)
- [x] Give `empty-state.tsx` a visual. Three dashed boxes can stack on an empty dashboard with no illustration and no example
- [x] Add a "Try this example" button that prefills `create-post-form` with the debugging paragraph from spec section 7
- [x] Password reset. **D5 was answered "add it"**

On a genuinely new account the dashboard now leads with a single primary "Start
here" Brand Kit step, demotes Create Post to outline, and the Brand Kit section
lower down just points back up instead of repeating the same dashed box a third
time. New accounts land on `/brand?welcome=1`, which retitles the page for that
one visit.

Password reset added `resend` plus two optional env vars. **Without
`RESEND_API_KEY` the reset link is written to the server log**, so local
development has a working flow and a misconfigured deployment fails visibly
rather than swallowing the link. The request path reports the same result
whether or not the address exists, so it cannot be used to enumerate accounts.
New route: `/reset-password`.

---

## Round 3: show the work

The product has a renderer that draws beautiful images of anything, and uses it
at zero decision points. This round is the single biggest lever on the
specificity verdict.

**Status: done.** `pnpm typecheck`, `pnpm lint`, `pnpm test` (228 passing) and
`pnpm build` all green.

### 3.1 The dashboard is text rows

- [x] Give `PostCard` a 4:5 thumbnail from the first slide's PNG, cached (`post-card.tsx:15-23`). Spec section 21 draws `[Post] [Post] [Post]` as cards; this renders a title and a date
- [x] This is also the only way the user can check grid consistency, which is the product's core promise (spec section 5)

The PNG route now distinguishes its two callers. `?download=1` is the Download
link, which produces a file the user will publish and so must refuse a
placeholder handle. Without it the route serves an in-app image with a short
private cache, which is what the thumbnail uses. `listRecentPosts` and
`listDrafts` return a `coverSlideId` alongside each row.

### 3.2 The editor hides the carousel

- [x] Replace the number strip with a filmstrip of the previews that are already rendered and sitting in the DOM behind `hidden` (`post-editor.tsx:157-175`, previews at `:188-192`). A 64px strip costs nothing extra
- [x] Show template on each filmstrip item, through its accessible name and title. Nothing previously distinguished slide 3 from slide 5 except the numeral
- [ ] Show over-limit state on a filmstrip item. Needs the per-template limits in the browser, which `slide-fields` has and the strip does not yet
- [x] Drag to reorder in the filmstrip. **D1 was answered "build it"**

`page.tsx` now calls `slideElement` **once** per slide and hands the same
element to both the filmstrip and the stage, so showing the carousel as a
sequence costs no extra renders. Dragging uses native HTML5 drag events, no new
dependency, and Move earlier / Move later stay exactly as they were so keyboard
and screen reader users lose nothing. New `moveSlideTo` resolves the drop
against stored order, like `moveSlide` already did, so a stale list cannot
reorder the wrong slide.

### 3.3 The preview is too small to judge

- [x] Make the preview responsive, `min(520px, available)`, instead of hard-coded 320px (`posts/[postId]/page.tsx:13`). At 320px a 1080px slide scales to 0.296, so body copy set at 32 renders at **9.5 CSS pixels** and captions at 7.7px
- [x] Add click-to-enlarge at full size. `dialog` is already installed
- [x] Make the editor preview sticky. `brand-kit-form.tsx:290` already does this; the editor, where live feedback matters more, does not (`post-editor.tsx:156`)

New `SlideStage` (`src/components/slide-stage.tsx`) measures its own width with
a `ResizeObserver` and scales to fit, so the preview grows with the column
instead of sitting at a constant 320px. It takes the slide size as plain
numbers rather than importing `@/templates`, which would drag the font metrics
table into the browser bundle. The stage is a zoom trigger: clicking opens the
slide at up to 592px, where body copy renders around 17px instead of 9.5px.

### 3.4 Nine layouts chosen by name

- [x] Replace the template dropdown with a grid of miniature renders from `src/templates/fixtures.ts` (`post-editor.tsx:264-280`). Nine options is the largest decision point in the app and it is pure recall in a product built for people who cannot visualize layouts

New `GET /api/templates/[kind]/png` renders one fixture per template in the
signed-in user's own Brand Kit, so the gallery shows what you would actually
get. Serving it as images keeps all nine off the editor's render path: nothing
is drawn until the picker is opened. The control is relabelled "Layout", which
is what it is.

### 3.5 The visual hint is a guessing game

- [x] Replace the free-text "Visual hint" field with a picker showing the actual `resolveIcon` vocabulary (`post-editor.tsx:286-293`, `templates/icons.ts`). The placeholder is `database_icon`, an internal identifier, and the help text says to "try another word" without ever revealing which words work
- [x] Disclose that "Generate illustration" calls a paid image model and takes seconds, and stop styling it identically to "Duplicate" (`post-editor.tsx:294-303`). `AGENTS.md` states the rule; the UI does not pass it on
- [x] Add generated illustrations to the Asset library so a good result can be reused (`actions.ts:217-220`, spec section 16)

All 42 icons are shown as real SVGs drawn from the same `iconNodes` the renderer
uses, so the picker cannot show a different mark from the slide. This costs no
bundle weight: `post-editor` already imported `resolveIcon`, which pulls
`icon-nodes` in regardless. The free-text field stays, retitled, because it is
also the prompt for an illustration.

Illustration generation moved into its own dashed panel that says plainly that
an image model costs money and takes seconds, which `AGENTS.md` already stated
as the rule while the UI kept it quiet. The panel only appears when no bundled
icon matches, so the cheap path stays the obvious one.

Generated illustrations are now Asset rows (spec section 16). That required
`setSlideIllustration` to stop deleting the previous blob: the library owns the
file now, and deleting it there would leave the library pointing at a dead URL.
Removing the asset is what removes the blob.

- [x] ~~Clean up orphaned blobs when an illustration is regenerated~~ **Not a defect.** The reviewer flagged this, but `setSlideIllustration` at `server/slides.ts:167` already calls `deleteUserFile` on the previous URL whenever it changes. Verified while implementing Round 1. No change needed

### 3.6 Export ends in silence

- [x] Convert export to a client component with a pending state. Both export links are bare `<a download>` with no client state at all while the server renders N PNGs sequentially (`post-editor.tsx:240-244`, `posts/[postId]/page.tsx:79-83`)
- [x] Add a completion panel: slide count, dimensions, filename, and a caption ready to copy. Peak-end is currently inverted, the product peaks in the middle and ends on a browser download shelf
- [x] Stop `markExported` firing on a single-slide download (`api/posts/[postId]/slides/[slideId]/png/route.ts:20`). Done in Round 2
- [x] Caption generation in the completion panel. **D3 was answered "do it"**
- [ ] The per-slide Download in the editor is still a bare `<a download>`. One slide renders fast enough that the silence is short, but it should share the panel's pending treatment

New `ExportPanel` fetches the zip rather than navigating to it, so it can show
"Rendering N slides..." during the wait, surface the 409 from a placeholder
handle as readable text instead of a blank page, and open a completion dialog
naming the count, the dimensions and the filename.

Caption generation was **decoupled from Instagram publishing**, which is what
had kept it in the Backlog. New `server/ai/caption.ts` and
`prompts/caption.v1.ts` follow the same provider and `generateStructured`
pattern as regenerate, with 5 new tests against a mocked provider. It is a
separate action from the export, so a model failure never costs the user the
download they actually came for. The shared shape lives in
`src/types/caption.ts` so the client can call `captionText` without importing a
`server-only` module.

---

## Round 4: the Brand Kit

Spec sections 5 and 33 make visual identity the entire differentiator. It got a
settings form with a preview that lies.

**Status: done.** `pnpm typecheck`, `pnpm lint`, `pnpm test` (238 passing, 10
new) and `pnpm build` all green.

- [x] Replace `BrandPreview` with real renderer output driven by `src/templates/fixtures.ts` (`brand-preview.tsx:3-6`). The comment still reads "Stand-in for the real renderer (Phase 6)"; Phase 6 shipped and `tasks.md:52` is ticked
- [x] Show three fixtures at once (Cover, Numbered list, Code) so card style, code block style and illustration style are all visible. Six of eleven controls currently produce no feedback at all: card style, illustration style, code block style, logo, and the secondary font's footer role
- [x] Update the preview live, debounced on kit change
- [x] Add four starter palettes that set colors, fonts, radius and card style in one click. Spec section 4 says this user is bad at graphic design; four raw hex pickers is the wrong tool for that person
- [x] Contrast-check background against text and warn below 4.5:1. `hexColorSchema` currently accepts a pair that renders every slide invisible
- [x] Disclose the blast radius on save: `slideTheme()` resolves from `loadBrandKit()` at render time, so a kit edit retroactively restyles every post including ones already marked Exported, and nothing says so
- [x] Give the five bare `<section>` elements real headings. Eleven controls, no sectioning, one Save button (`brand-kit-form.tsx`)
- [x] Put the save confirmation in a live region. "Saved." is a plain `<span>` while the error branch two lines down has `role="alert"` (`brand-kit-form.tsx:281`)
- [x] Resolve "Brand Kit" being an `h1` on `/brand` and an `h2` on `/dashboard:95`. The dashboard section is now "Your brand"

The preview could not stay a server component and still update as you type, so
`/api/templates/[kind]/png` gained an optional `kit` parameter carrying the
unsaved kit. Anything the schema rejects, which is what a half-typed hex code
looks like, falls back to the saved kit rather than erroring. The images are
`unoptimized`: the kit changes on every edit, so an optimizer entry per
keystroke would be pure waste.

The four presets set fonts, colors, radius and all three styles, and
deliberately leave name, handle, logo, avatar and voice alone, because those are
the user's and not part of a look. Every preset clears AA on text against
background.

Contrast lives in `src/lib/contrast.ts`, pure and client-side so the warning
appears as you type, with 10 unit tests including the canonical `#767676`
reference pair. It warns rather than blocks: it is the user's brand.

The blast-radius line uses the real post count, so it says "all 12 of your
posts" rather than a vague warning, and notes that already-exported PNGs keep
the old look.

---

## Round 5: the generation wait

Three sequential model calls, roughly 20 seconds, and the client is told
nothing beyond one static sentence.

**Status: done.** `pnpm typecheck`, `pnpm lint`, `pnpm test` (240 passing, 2
new) and `pnpm build` all green.

- [x] Report the pipeline stage. `generate-post.ts:22-24` runs analyze, then structure, then plan, and the server knows exactly where it is (`create-post-form.tsx:161-168`)
- [x] Use `ui/skeleton.tsx` during the wait. It was installed in Phase 0 for this and is never imported anywhere
- [x] Let the user cancel
- [x] Persist something when the tab closes mid-generation. The model calls complete server-side and are discarded with no trace (`create-post-form.tsx:69-79`)
- [x] Stream the stages. **D4 was answered "stage reporting now"**
- [ ] Streaming the first validated _slide_, rather than the stages, is still open. It would turn the 20 second wait into roughly a 6 second first paint but means restructuring `planDesign` and the persistence path
- [ ] The retry case. `structured.ts` retries once on invalid output, which doubles the wait. The stage list no longer claims a fixed duration, so this is less misleading than it was, but a retry still looks like a stall

`generatePost` now takes an `onStage` callback, and the work moved from a server
action to `POST /api/posts/generate`, which streams newline-delimited JSON: one
event per stage, then the outcome. A server action had nowhere to put progress,
which is why the client showed one static sentence for the whole wait.

Three things fall out of that. The user can **cancel**, through an
`AbortController`. The **draft is written before the final event**, so closing
the tab mid-generation now leaves a post rather than discarding paid-for model
calls. And the stage list is honest: it names what is running, rather than
guessing at elapsed time.

`posts/new/actions.ts` was deleted; the route replaces it.

---

## Round 6: states and error routes

`src/app` contains zero `error.tsx`, `loading.tsx`, `not-found.tsx` and
`global-error.tsx`. There is no `middleware.ts` and no `Suspense` anywhere.

**Status: done.** `pnpm typecheck`, `pnpm lint`, `pnpm test` (238 passing) and
`pnpm build` all green.

- [x] `error.tsx` at the root
- [x] `global-error.tsx`
- [x] `not-found.tsx`. `posts/[postId]/page.tsx:29` calls `notFound()` today and falls through to the stock Next.js page
- [x] `loading.tsx` for `/dashboard`, `/brand`, `/assets`, `/posts/[postId]` and `/posts/new`
- [x] Give the N-slide render on `/posts/[postId]` a fallback. It awaits `Promise.all` over every slide before any markup appears (`posts/[postId]/page.tsx:34-46`)
- [x] Stop leaking Zod issue paths into user-facing strings. They currently produce text like "items 0 title must not be empty" (`actions.ts:39-42`, `posts/new/actions.ts:20-21`)

`loading.tsx` at the route level gives the whole blocking navigation a fallback,
which is what the editor actually needed: it awaits every slide render before
any markup. Each skeleton mirrors its own page's shape rather than being a
generic spinner, and this is the first use of `ui/skeleton.tsx`, installed in
Phase 0 and imported nowhere until now.

New `src/lib/issues.ts` turns a Zod issue into a sentence and drops the path.
Three call sites used to join the path in, producing text that reads as a stack
trace. The paths inside `server/ai/structured.ts` are left alone: those are
diagnostic, aimed at the model and the log, and never shown to the user.

---

## Round 7: accessibility

The Phase 8 accessibility pass was real work. Every form field is labelled,
there are zero raw `<img>` tags and zero div click handlers. It stopped at
labels and never reached contrast, focus, touch targets, motion or error
association.

### 7.1 Contrast (measured, not estimated)

**Status: done**, together with [D6](#d6-dark-mode-wire-it-or-delete-it).
`pnpm typecheck`, `pnpm lint`, `pnpm test` (240 passing) and `pnpm build` all
green.

- [x] `border` and `input` vs background: **1.26:1**, needs 3:1. This is the boundary of every Input, Textarea, SelectTrigger and bordered container in the app (`globals.css`)
- [x] `ring` vs background in light mode: **2.59:1**, needs 3:1. Affects the two hand-rolled focus rings at `app-nav.tsx:29` and `post-editor.tsx:166`; the shadcn primitives use `ring-ring/50` which composites to roughly 1.7:1 over white
- [x] `muted-foreground` vs background: **4.73:1**, passing by 0.23, and it carries real information at 12px in 14 places. Darken it
- [x] `muted-foreground` vs `muted`: **4.34:1**, failing. Latent today because no text sits on `bg-muted`, but fix the token

`border` and `input` were one token doing two jobs, which is why the number was
indefensible. They are now separate. `--input` is the edge of a control, which
WCAG 1.4.11 covers, and hits **3.03:1** light and **3.77:1** dark. `--border` is
a decorative container edge that 1.4.11 does not cover, so it only got dark
enough to see: **1.37:1** light, **1.91:1** dark. Calling that a pass would be
wrong, and making every card edge mid-grey would be a real design cost for no
accessibility gain.

`--ring` is **5.33:1** light and **7.66:1** dark, and the five primitives that
used `ring-ring/50` now use full opacity, because the composite was the real
ratio and it was about 1.7:1. `--muted-foreground` is **5.10:1** on background
and **4.68:1** on muted.

Every number above is computed with `src/lib/contrast.ts`, the same function the
Brand Kit warning uses.

### 7.2 Errors and state

- [x] Set `aria-invalid` and `aria-describedby` on over-limit fields. Neither attribute is set at a single call site in the codebase (`create-post-form.tsx:86,95,155`, `slide-fields.tsx:34,39,47`)
- [x] Stop signalling over-limit by color alone. The counter text is identical in both states (`slide-fields.tsx:34`, `create-post-form.tsx:95`). Both now change their wording, not just their colour
- [x] Label the regenerate action `Select` and the free-text `Input` under it. These are the only unlabelled controls in the app (`post-editor.tsx:356`, `:368-372`)
- [x] Announce sign-out (`sign-out-button.tsx:22`) and post status changes (`post-status.tsx`)
- [x] While in `post-status.tsx`: the optimistic status change used to stand even when the write failed. It now rolls back and says so

### 7.3 Structure

- [x] Give `/sign-in` an `h1`. `CardTitle` renders a `div` (`sign-in-form.tsx:53`, `ui/card.tsx:30-34`). Done in Round 2, since the file was being rewritten for password reset
- [x] Fix the dangling `aria-controls`. `sign-in-form.tsx:57-107` uses `Tabs` and `TabsTrigger` with no `TabsContent`, so both triggers point at panels that do not exist. Done in Round 2: the form now lives inside `TabsContent`
- [x] Add a skip-to-content link. There are zero in the codebase
- [x] Give the slide strip a real role. Round 3 replaced it with an `ol` of labelled buttons, each naming its slide number and template, which suits navigating a sequence better than a tablist would
- [x] Label the brand color swatches on the dashboard. Three `size-6` circles with no text and no `aria-label` (`dashboard/page.tsx:109-119`). Marked `aria-hidden`: the link already has an accessible name, and three unnamed colours add nothing

### 7.4 Targets and motion

- [x] Raise touch targets toward 44px. Nothing in the app reaches it: default buttons 36px, `size="sm"` 32px across 19 usages, nav links 32px, slide chips roughly 28x24px, dialog close 16x16px
- [x] Add `prefers-reduced-motion` handling. Zero occurrences in the entire `src/` tree, while dialog, select and dropdown all run enter/exit animations unconditionally
- [x] `pnpm dlx shadcn@latest add tooltip` and explain disabled controls

Targets went up a step rather than straight to 44px: default buttons and inputs
36 to **40px**, `sm` 32 to **36px**, icon buttons 36 to **40px**, nav links 32 to
**40px**, the dialog close 16 to **32px**, and the old 28x24px slide chips are
gone entirely, replaced in Round 3 by filmstrip thumbnails that are much larger.
Nothing is now near the 24px AA floor. Going to 44px everywhere is the AAA
target and would change the app's density enough to be a design decision rather
than a fix, so it is called out here rather than done silently.

Disabled controls got explained where the reason is not already on screen. Where
it is, like the character counter under Generate, a tooltip would just repeat it.

---

## Round 8: responsive

**Status: done.** `pnpm typecheck`, `pnpm lint`, `pnpm test` (240 passing) and
`pnpm build` all green.

- [x] Fix the editor slide row at 390px. It needs **416px** against **342px** available, and both arrows carry `shrink-0`. Fixed in Round 3: the stage is `min-w-0 flex-1` and measures itself, so it takes whatever the arrows leave rather than forcing a fixed 320px
- [x] Give `app-nav` a real mobile treatment. Four links plus wordmark plus sign-out exceed 342px and wrap to two or three rows; there is no hamburger, no drawer, and no breakpoint class in the file (`app-nav.tsx:19`, `(app)/layout.tsx:14`)
- [x] Add an `md:` layout step. The only two `md:` classes in the app are font-size steps inside input primitives, so the 640 to 1023px band gets the one-column phone layout
- [x] Clamp the post title `h1`. No `truncate`, no `line-clamp`, no `break-words`, and there are zero `break-*` utilities in the codebase (`posts/[postId]/page.tsx:55`)
- [x] Reconsider preview-above-fields on mobile. Every keystroke is below the fold from the thing it changes (`post-editor.tsx:155`)

No hamburger and no drawer, because neither is installed and four short links do
not need one. On phones the header splits: wordmark plus account controls on the
first row, the nav on its own horizontally scrollable row below, with the
scrollbar hidden. From `sm` up it collapses back to the single row it was.

The editor gets a real `md` step at 340px of preview, and the preview column
becomes sticky from `md` rather than `lg`, which is what stops the fields
scrolling away from the thing they change on a tablet. On phones the preview is
still above the fields, and that is deliberate: it is the reason to be on the
page, and the filmstrip needs to lead.

---

## Round 9: performance

**Status: mostly done**, with the woff2 conversion left open and explained
below. `pnpm typecheck`, `pnpm lint`, `pnpm test` (243 passing, 3 new) and
`pnpm build` all green.

- [x] Stop re-rendering every slide on every mutation, in the part that actually costs: Shiki tokenisation is now memoised, so a refresh re-runs the JSX but not the highlighter
- [x] Throttle the `fontScale` range and the color inputs, which fire continuously during a drag (`slide-design.tsx:42,71`)
- [x] Add `rel="preload"` for the two faces the active kit actually uses
- [x] Drop the unnecessary `"use client"` from `slide-fields.tsx`
- [ ] Ship woff2 subsets to the browser and keep the TTFs server-side for Satori. **Not done, and not fakeable here**: converting TTF to woff2 needs `fonttools` or `woff2_compress`, and neither is installed on this machine. `public/fonts/` is still **1.63 MB** across ten unsubsetted TTFs. The remedy, for whoever has the tooling: `pyftsubset <file>.ttf --flavor=woff2 --unicodes=U+0000-00FF,U+2000-206F --output-file=<file>.woff2`, then add a `woff2` `src` ahead of the `truetype` one in `globals.css`. Satori keeps reading the TTFs, so `server/render/fonts.ts` does not change
- [ ] An optimistic client preview. `slideElement` is pure and could run in the browser, but it reaches `templates/`, which pulls the font metrics table into the bundle. Worth its own decision rather than a quiet refactor
- [ ] `slide-design.tsx` keeps its `"use client"`: it now holds local state for the throttle, so the directive is correct

The refresh storm has two halves, and only one of them was ever the expensive
one. Re-running the JSX for N slides is cheap; re-tokenising every code slide
through Shiki is not. `highlightCode` now keeps a bounded 200-entry cache keyed
on theme, language and the snippet itself, so the editor's repeated re-renders
hit it instead. Three tests cover reuse and the two ways it must not reuse.

The drag inputs now hold their own state and tell the draft once the drag
settles, rather than restarting the editor's autosave timer sixty times a
second.

Font preloading is the other real win: ten `@font-face` rules are declared but a
browser only fetches one when a glyph needs it, which is after CSS parse and
layout. The signed-in layout now preloads exactly the two faces the user's kit
uses.

---

## Round 10: consistency, copy and hierarchy

### 10.1 Copy

**Status: done.** `pnpm typecheck`, `pnpm lint`, `pnpm test` (243 passing) and `pnpm build` all green.

- [x] Move `postTypeLabels` to `src/types/post.ts` and use it on the post page, which printed the raw enum lowercase as "things i learned"
- [x] Change the format toggle to "Carousel" and "Square" with the ratios as secondary text
- [x] Settle Title Case versus sentence case. Sentence case everywhere: "Your content", "Your assets", "Recent posts", "Create post"
- [x] Settle Delete versus Remove. Delete is now always permanent ("Delete slide", "Delete illustration", "Delete asset"); Detach is the reversible one ("Detach image", which leaves the asset in the library)
- [x] Settle the one feature named three ways: nav, dashboard CTA and page heading all read "Create post". The submit button stays "Generate" because that names the action, not the destination
- [x] Make the regenerate action labels parallel. All verb-first now: "Rewrite it", "Shorten it", "Clarify it", "Go deeper"
- [x] Remove the en-GB leakage: "Centre", "colour" and "emphasise" are all gone
- [x] Make ellipses consistent. The live status now matches the button labels

### 10.2 Hierarchy

- [x] Differentiate the editor's three tree levels, previously all `text-sm font-medium`. "Slide N" is now the column heading at `text-lg font-semibold` and carries its template name; the panels below stay `text-sm`
- [x] Promote the dashboard section headings. `text-sm font-medium` above a grid read as a label, not a heading
- [x] Decide on the success metric line. **Kept**, and raised from 12px to 14px. It is the product's own measure of whether it works, and spec section 21 bans an analytics panel, not one honest sentence
- [x] Break up the editor's five-button row. Three groups now, with Delete set apart and coloured rather than sitting between Duplicate and Download
- [x] Style the design panel. It now has a rotating chevron and says what is inside, instead of reading as a static box

### 10.3 Visual system

- [x] Reconcile slide Delete with asset Delete. Both read as destructive now
- [x] Replace the `&larr;` and `&rarr;` HTML entities with `ChevronLeft` and `ChevronRight`. `lucide-react` had zero icons in the app UI; it is now used in the nav, the editor, the export panel, the breadcrumb and the icon picker
- [ ] Narrowing the spacing set, and reconciling `rounded-xl` on the slide preview against `rounded-lg` everywhere else, are both still open. Real but cosmetic, and they want one deliberate pass over every surface rather than being folded into a round that was fixing other things
- [x] Widen the type scale. The ladder is now `text-2xl` page, `text-lg` section, `text-sm` panel, `text-xs` meta, rather than one step from title to everything
- [x] Guard against `slide-fields.tsx:27` deriving input ids from label text. Now `useId()`, which cannot collide and needs nothing from callers

---

## Round 11: editor efficiency

**Status: done**, bar one deliberate omission.

- [x] Keyboard navigation between slides. Left and right now move between slides, and are ignored inside inputs, textareas and dialogs so they never steal a caret move
- [x] Preserve the active slide when switching format. The slide index rides in the URL, so checking the square crop on slide 5 leaves you on slide 5
- [x] Prefix-match the nav active state and add a breadcrumb home from the editor
- [x] Reduce reordering cost. Round 3's drag makes it one action instead of four
- [ ] Keyboard shortcuts beyond the arrows, and duplicate-post / regenerate-whole-post. Left out on purpose: a shortcut set is worth deciding as a set, and neither bulk action has a demonstrated need yet

---

## Decisions needed

**All eight were answered on 2026-09-15.** Seven went with the recommendation
below; D7 went further and asked for a real landing page rather than just the
redirect. Nothing in this file is blocked any more.

Every item here is either banned by the spec, parked in the Backlog, or absent
from the plan entirely. The recommendations are kept as the record of why each
went the way it did.

### D1: drag to reorder vs the "no drag-and-drop" ban. ANSWERED: build it

Spec section 23 excludes a "Complex drag-and-drop editor" from the MVP and
section 13 says "The user should not need a full Canva-like editor."

**Recommendation: build it, and read the ban narrowly.** The ban is on a
free-positioning canvas where the user drags text boxes around a slide. That
ban is correct and should stay. Dragging a thumbnail along a filmstrip to
reorder slides is a different interaction: it is the same operation
`moveSlideAction` already performs, and spec section 13 lists "Change slide
order" as a required editor capability. The current implementation costs one
click and one full page refresh per position. I would not treat a one-axis list
reorder as the thing section 23 was protecting against.

### D2: save a design as a reusable template. ANSWERED: do it, after Round 4

Spec section 15, parked in the Backlog at `tasks.md:123`.

**Recommendation: do it, after Round 4.** This is the mechanism by which
"consistently good" becomes true over time rather than per post, and it is the
concrete form of the spec's own promise that every post should feel like it
came from the same account. It is also cheap now: `designConfig` and `PostSpec`
already exist and the `template` table is already in the schema. The reason to
wait for Round 4 is that the Brand Kit should tell the truth before users start
saving looks derived from it.

### D3: caption generation at the export moment. ANSWERED: do it

Spec section 20, parked in the Backlog at `tasks.md:124`, and explicitly tied
there to publishing, which is not being built.

**Recommendation: do it, decoupled from publishing.** The Backlog entry bundles
caption generation with Instagram publishing, and that bundling is what has kept
it out of scope. The caption does not need publishing to be useful. Spec section
34's secondary metric is the share of generated posts actually published, and
the export moment is exactly where that number is won or lost: right now the
user gets a zip and silence, then switches to a file browser, then to their
phone, and writes the caption from scratch with the product's involvement
already over. A caption in the completion panel is the cheapest thing on this
whole list that moves that metric.

### D4: streaming generation. ANSWERED: stage reporting now

Not in `tasks.md` at all, in any phase or the Backlog.

**Recommendation: do the stage reporting now, defer true streaming.** Round 5's
stage reporting gets most of the perceived-speed benefit for very little work,
because `generate-post.ts` already runs three discrete stages. True streaming of
the first validated slide would turn a 20-second dead wait into roughly a
6-second first paint, but it means restructuring `planDesign` and the
persistence path, so it deserves its own decision rather than being smuggled in.

### D5: password reset (needs email infrastructure). ANSWERED: add it. Done in Round 2

The sign-in decision at `tasks.md:117` settled on email and password only. That
decision did not consider recovery, and there is no reset link anywhere in the
app. A forgotten password is currently a dead end.

**Recommendation: add it, and accept the new dependency.** This is not a design
nicety, it is a total lockout with no path out, and it is the one bug on this
list that can permanently cost a real user their account. Better Auth supports
it directly, but it needs a transactional email provider (Resend is the obvious
fit for this stack) plus one env var. That is genuinely new infrastructure, so
it is your call, but shipping an email-and-password product with no reset is not
a position I would defend.

### D6: dark mode, wire it or delete it. ANSWERED: wire it

`globals.css:131-150` defines a complete dark palette and `globals.css:4`
defines the variant. Nothing ever applies `.dark`. There is no ThemeProvider,
no toggle, and no `prefers-color-scheme` block. `next-themes` is installed and
imported only by the never-mounted Toaster.

**Recommendation: wire it.** The tokens are already written and measured, the
dependency is already installed, and the dark column actually scores better on
contrast than the light one. Mounting a provider and a toggle is a small change
against a palette that already exists. There is a real argument the other way:
a user on a dark OS currently gets a white app whose default Brand Kit is
`#0B0B0F`, which is jarring either way. But deleting working tokens to avoid a
provider is the worse trade.

**Done in Round 7.** `ThemeProvider` wraps the root layout, `next-themes` stops
being a dependency imported only by the Toaster, and a light/dark/system toggle
sits in the app header. `<html>` carries `suppressHydrationWarning` because the
theme class is written before paint. The toggle renders a neutral icon until
mount, since the server cannot know the OS preference.

### D7: landing page, redirect only or a real page. ANSWERED: build the real page

The spec has no marketing surface. Nothing bans one.

**Recommendation: redirect now, build the page separately.** The redirect is a
two-line fix and should land today regardless. Whether Compose needs a real
landing page is a product question about whether it is ever shown to anyone but
you, and spec section 35 says the first user is the creator herself. If this
stays personal, the redirect is the whole answer and a landing page is wasted
work.

### D8: does Compose get a visual identity of its own. ANSWERED: neutral chrome, bold moments

The app palette is chroma zero on every token except `--destructive`. There are
no icons. The type scale is two effective steps.

**Recommendation: neutral chrome, bold moments.** Keeping the working surfaces
quiet is defensible and arguably correct, because the user's brand colors should
be the only real color on screen. But "quiet" and "undesigned" are not the same
thing, and right now the app is the second. The fix is precision within neutral:
a real type scale, icons, deliberate spacing, and then genuine design investment
at the three moments that carry the product, which are first run, the generation
wait, and the export completion panel. That is where character belongs in an
Operate-mode tool.

---

## Not doing, and why

- **Analytics dashboard.** Spec section 21 says not to build one initially. The one metrics line at `dashboard/page.tsx:50` is the existing compromise and Round 10 only asks whether to keep or drop it. No change to the ban.
- **Automatic illustration generation.** The `tasks.md:118` decision that generation is never automatic is correct and stays. Round 3.5 only asks the UI to disclose the cost, which is what `AGENTS.md` already says the rule is.
- **Adding fonts.** The fixed font list is deliberate and correctly explained to the user at `brand-kit-form.tsx:155-157`. Round 9 changes the transport format only, never the list.
- **Instagram publishing, scheduling, multi-platform, GitHub integration, content ideas, content memory.** Backlog, and none of them were implicated in any review finding.
