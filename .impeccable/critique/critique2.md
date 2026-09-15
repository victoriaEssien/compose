Assessment A: Design Review of Compose

1. Design specificity verdict
   The signed-in product UI is interchangeable shadcn CRUD scaffolding. The slide renderer is not. There are two products in this repo built to completely different standards, and the one the user actually touches is the weaker one.

The app chrome could be lifted into any B2B SaaS with a find-and-replace on four nav labels. Evidence:

src/components/post-card.tsx:15-23 is a bordered <Link> with a title and a "Draft · 12 Mar" line. A tool whose entire promise is "your posts look good" shows the user zero pixels of their posts on the dashboard. No thumbnail, no color, no aspect ratio. Spec §21 literally draws [Post] [Post] [Post] as cards, and this renders text rows.
Every page is the same skeleton: mx-auto max-w-5xl px-6 py-10, an h1 at text-2xl font-semibold, a text-muted-foreground text-sm subtitle. dashboard/page.tsx:46-49, brand/page.tsx:11-15, assets/page.tsx:12-16, posts/new/page.tsx:5-10. Four surfaces, one template, no differentiation between "review your work" and "configure your identity."
The color system is untouched shadcn neutral-gray. globals.css:114-134 is the generated oklch(... 0 0) palette, chroma zero on every token except --destructive. Compose has no brand color of its own. The accent color the product cares about lives only inside the user's slides.
templateKinds (src/types/slide.ts:9-19) defines nine visual layouts. The editor picks between them with a text dropdown: post-editor.tsx:264-280 renders templateNames[kind]. Choosing "Comparison" versus "Numbered list" is a pure act of recall in a product built for people who cannot visualize layouts.
lucide-react is a dependency (package.json), and the app UI contains not one icon. Slide navigation uses HTML entities as button labels: &larr; and &rarr; at post-editor.tsx:185,201.
src/app/page.tsx:10 ships the string "Boilerplate is ready; see tasks.md to start building." to production at /.
Where the product genuinely has character, and it is real character:

src/templates/primitives.tsx:14-93. The Frame primitive is authored: 80px padding, a 44px avatar pinned bottom-left, username in the secondary face at muted, slide counter at 45% alpha bottom-right. theme.ts:16 reserves 44 + 48 of footer height so copy can never kiss it. That is a designer's decision encoded in a constant.
theme.ts:42-47. Four card surfaces derived as alpha-over-text rather than fixed grays, so "Outlined" stays correct whether the brand is white-on-black or black-on-cream. That is a real design system.
theme.ts:66-75. A named type scale (display / heading / body / item / code / caption / footer / eyebrow) with the display size stepping 76 to 68 between 4:5 and 1:1. Someone thought about optical size per format.
The fitting doctrine in AGENTS.md and theme.ts:89-96: measuring real glyph advances and shrinking type to fit rather than rejecting the user's copy. This is the product thesis expressed as engineering.
So the verdict: the output is designed, the instrument is not. The user spends 100% of their time in the instrument.

2. Holistic design
   The generation wait
   create-post-form.tsx:161-168. Press Generate and you get button text flipping to "Generating..." plus one static sentence: "Reading your content, structuring it and planning the slides. About 20 seconds."

That sentence is the single best piece of UX writing in the app, and it is doing all the work alone.

generate-post.ts:22-24 runs three sequential model calls (analyzeContent → structureContent → planDesign). The server knows exactly which stage it is in. The client is told nothing. A three-stage pipeline that reports zero stages is a wasted affordance.
src/components/ui/skeleton.tsx was installed in Phase 0 specifically for this and is never imported anywhere (grep returns nothing outside the file itself). The slide count is not known in advance, but the shape is: a preview frame plus a field column.
No cancel. No way to leave. The form is a client transition, so navigating away kills the request with the post unsaved and nothing written.
structured.ts retries once on invalid output. A retry doubles the wait, and the user sees the same static "About 20 seconds" going on 50.
Deferred-scope note: streaming is not in tasks.md. Recommend it anyway. planDesign returns slides in order; streaming the first slide preview as soon as it validates converts a 20-second dead wait into a 6-second first-paint.
The editor
Spatially, the preview/edit relationship is the right idea and the wrong execution. post-editor.tsx:155: grid gap-10 lg:grid-cols-[420px_1fr]. Preview left, fields right.

The preview is 320px wide (posts/[postId]/page.tsx:13, previewWidth = 320), hard-coded, never responsive upward. A 1080px slide scaled to 0.296. Body copy set at theme.type.body = 32 renders at 9.5 CSS pixels. Caption text at 26 renders at 7.7px. On a 27-inch monitor the user is judging typography they cannot read. There is no zoom, no lightbox, no full-size view, and the 420px column has 100px of dead space beside a 320px image.
The preview is not sticky. post-editor.tsx:156 is a plain flex column. The Brand Kit form does pin its preview (brand-kit-form.tsx:290, lg:sticky lg:top-10). The editor, where live feedback matters far more, does not. On mobile the preview stacks above the fields, so every keystroke you type is below the fold from the thing it changes.
Can the user see what a change does? Only after a round trip. Typing debounces 900ms (post-editor.tsx:50,99), hits saveSlideAction, then router.refresh() at line 112 re-renders the server preview. So preview lag is roughly 900ms plus a server render. There is no optimistic client preview even though slideElement is pure and could run in the browser.
Undo: none. Anywhere. Not for edits, not for delete, not for regenerate, not for template change.
Autosave communication: post-editor.tsx:251-253 is a text-xs text-muted-foreground span showing "Working" / "Saving" / "Saved". It is wiped to "" by run() at line 131. The user's confidence that their work is safe rests on a 12px gray word that vanishes.
Silent data loss. editor-state.ts:43-47: shouldAutosave returns false when draft.id !== slide.id. Click slide 2 within 900ms of your last keystroke and the effect cleanup at post-editor.tsx:115 clears the timer, then the sync effect at lines 89-93 replaces the draft. Those keystrokes are gone with no warning. Same on navigating away, same on closing the tab. There is no beforeunload guard.
Slide navigation and reordering
The recent commits fixed the right bug. post-editor.tsx:138-144: move() reorders the post and follows the slide with setActive(target), while the arrows at lines 178-202 only change what you look at. The aria-labels ("Reorder: move this slide earlier in the post" vs "View the previous slide") are careful and correct.

What is still wrong:

The number strip (post-editor.tsx:157-175) is the only representation of the post as a sequence, and it is a row of digits. In a carousel tool, the post-level view should be a filmstrip of thumbnails. The user cannot see the arc of their own carousel, which is the one thing a carousel lives or dies on.
Reordering is two buttons that each cost a server round trip plus a full refresh. Moving slide 6 to position 2 is four clicks and four refreshes. AGENTS.md bans a drag-and-drop canvas editor (spec §13, correctly). It does not ban reordering a filmstrip.
The strip has no indicator of template, state, or whether a slide is over its text target. Nothing distinguishes slide 3 from slide 5 except the numeral.
Export
This is the weakest moment in the product, and by peak-end it is the one that defines the memory.

post-editor.tsx:240-244 and posts/[postId]/page.tsx:79-83 are bare <a download> tags. There is no client state at all. export/route.ts:28-39 renders every slide through Satori sequentially, then zips. For a six-slide post that is multiple seconds of a page that looks completely idle. The user will click it again.
There is no success state. No "6 PNGs, 1080 x 1350, ready to post." No filename shown. No next step. The end of the primary flow is a browser download shelf.
png/route.ts:20 calls markExported on a single-slide download. Download one slide to check it and the whole post silently flips to "Exported," drops out of listDrafts (posts.ts:19-26), and reappears under "Recent Posts." The user's Drafts list changes behind their back because they inspected one image.
export/route.ts:48 uses zipSync(files, { level: 0 }), store-only. Correct for PNGs, and worth noting as competent.
Brand kit
Spec §5 calls this the core product principle. Spec §33 makes it the differentiator. The implementation is a settings form, and the preview lies.

brand-preview.tsx:3-6 still carries the comment "Stand-in for the real renderer (Phase 6) so colors, fonts and radius can be judged." Phase 6 shipped. tasks.md:52 is checked off. The stub was never replaced. The Brand Kit preview is hand-written Tailwind that renders a fake slide the renderer would never produce.
Consequence: of the eleven controls in brand-kit-form.tsx, the preview reflects five. Card style, illustration style, code block style, logo, and the secondary font's role in the footer all render no feedback whatsoever. kit.style.card drives theme.ts:42-47 surfaces; the preview has no surface. kit.style.codeBlock drives primitives.tsx:194; the preview has no code. The user picks "Glass" versus "Elevated" blind.
isDefaultBrandKit (types/brand.ts:83-85) compares only name and username. A user who spends fifteen minutes choosing colors, fonts, radius and voice, but leaves the name as "Your brand," is still told on dashboard/page.tsx:99 that "Your Brand Kit is not set up."
The placeholder handle ships into the artifact. defaultBrandKit.username = "@yourhandle" (types/brand.ts:73), and Frame draws username in the footer of every slide (primitives.tsx:71-83). Nothing in the create-post flow, the editor, or the export path checks whether the brand is still default. A new user's first carousel exports with @yourhandle burned into all six PNGs.
No indication that editing the Brand Kit retroactively restyles every existing post, which it does: slideTheme() resolves from loadBrandKit() at render time. Change your accent color and posts already marked Exported look different from the PNGs sitting on the user's disk. That consequence is invisible.
One flat form, eleven controls, one Save button at brand-kit-form.tsx:278. No sectioning beyond bare <section> elements with no headings. No presets. For a product whose thesis is "you are not good at graphic design," handing the user four raw hex pickers with no palette suggestions, no contrast check, and no "start from a look" is an abdication. A background/text pair failing contrast is accepted silently by hexColorSchema.
Assets and illustration generation
post-editor.tsx:294-303. "Generate illustration" is an outline button, visually identical to "Duplicate" and "Move earlier." Nothing tells the user it calls an image model, costs money, or takes seconds. AGENTS.md states the rule explicitly ("Generation is never automatic, because it costs money and takes seconds"), and the UI does not pass that on. Pending state is busy ? "Working..." shared with every other action in the component.
post-editor.tsx:286-291. The field is labeled "Visual hint" with placeholder database_icon. That is an internal identifier from icons.ts surfaced as user-facing copy. The help text at line 152 says "No icon matches this hint. Generate an illustration, or try another word," while never revealing which words work. resolveIcon has a finite vocabulary and the UI hides it. The user is asked to guess at a dictionary they cannot see, with a paid API call as the fallback for guessing wrong.
Generated illustrations go to blob storage (actions.ts:217) and are never added to the Asset library, so a good generated illustration cannot be reused on another slide. Spec §16 wants illustrations in the library.
asset-uploader.tsx:53-60 is a raw <input type="file">. No drag and drop, no paste, no preview before upload, no progress. For a tool where the primary asset is a screenshot the user just took, not supporting paste-from-clipboard is the single highest-value missing interaction in the Assets page.
States
No loading.tsx, no error.tsx, no not-found.tsx, no global-error.tsx anywhere under src/app. Confirmed by find. Every server-component page (dashboard, brand, assets, and the post editor which awaits loadRenderablePost plus N Satori renders at posts/[postId]/page.tsx:34-46) blocks with no fallback. notFound() at line 29 renders the stock Next.js 404.
Empty states: empty-state.tsx is a dashed border with two lines of text. Three of them can stack on the dashboard at once. No illustration, no sample carousel, no "try this example content." The copy itself is good (dashboard/page.tsx:84).
Success: only brand-kit-form.tsx:281, a text-sm text-muted-foreground "Saved." Everything else has no success state. sonner is installed, ui/sonner.tsx exists, and <Toaster /> is never mounted and toast() is never called. Dead dependency.
Disabled: used correctly and consistently (create-post-form.tsx:161, post-editor.tsx:210,235). Button disabled is opacity-50 with pointer-events-none, so a user cannot hover to learn why Generate is disabled. No tooltip primitive is installed.
Dark mode is dead code. globals.css:136-155 defines a complete dark palette and globals.css:4 defines the variant. Nothing ever applies .dark. next-themes is a dependency, imported only by the unmounted ui/sonner.tsx:10. There is no ThemeProvider and no toggle. A user on a dark OS gets a white app whose default Brand Kit is #0B0B0F.
Typography and color
One scale, applied flatly: text-2xl page title, text-sm font-medium section heading, text-sm/text-xs for everything else. dashboard/page.tsx:59,70,95 uses text-sm font-medium for section headings that sit above grids, which reads as a label, not a heading. The dashboard's most important object (a post) and its least important (a metrics footnote at line 50) differ by one size step.

text-muted-foreground at text-xs carries real information in at least four places: the metrics line (dashboard/page.tsx:50), the autosave status (post-editor.tsx:251), the visual help text (post-editor.tsx:293), and post metadata (post-card.tsx:20). oklch(0.556 0 0) on white is roughly 4.6:1, which passes AA for body text but is the wrong register for save status.

UX copy
Genuinely strong, and the strongest part of the app UI. create-post-form.tsx:65 ("That is 42 characters over. Trim it down to 6000."), actions.ts:32 ("That slide is gone. Reload the page."), actions.ts:110 ("A post needs at least one slide."), posts/new/actions.ts:34 (names the failing stage). Plain, specific, no em dashes, per AGENTS.md.

Failures:

posts/[postId]/page.tsx:53 renders post.type.replaceAll("_", " ") → "things i learned" in lowercase, when create-post-form.tsx:19-28 already holds the correct labels. Same enum, two treatments, one page apart.
page.tsx:60-77: the format toggle's visible text is "4:5" and "1:1". The aria-labels are right; sighted users get ratio jargon with no indication that 4:5 is the carousel default.
Zod paths leak: actions.ts:39-42 and posts/new/actions.ts:20-21 join the issue path into the message, producing strings like "items 0 title must not be empty."
Edge cases and accessibility
sign-in-form.tsx:57-107: Tabs + TabsList + TabsTrigger with no TabsContent. Radix sets aria-controls on each trigger pointing at a panel that does not exist. The form lives outside the tab structure entirely. Broken ARIA reference on the first screen of the product.
No password reset link, anywhere. Better Auth is configured email-and-password only (tasks.md Decisions). A forgotten password is a dead end with no path out.
post-editor.tsx:342-347: a raw <details>/<summary> for the design panel, unstyled, no chevron, sitting among Cards and bordered divs. It reads as a static box; many users will never discover per-slide color and size controls.
The slide strip (post-editor.tsx:157-175) has no role="tablist". It is N buttons with aria-current="true", which is a nav pattern applied to non-nav content.
app-nav.tsx:21 matches pathname === href exactly, so /posts/abc123 highlights nothing. The editor, where users spend the most time, has no "you are here" and no breadcrumb back to the dashboard.
Format switching is a <Link> navigation (page.tsx:71), so it resets active to 0 in the editor. Reviewing slide 5 and checking the square crop drops you back to slide 1.
No skip-to-content link.
Long titles: post-card.tsx:19 clamps to 2 lines. Good. posts/[postId]/page.tsx:55 does not clamp at all. 3. Cognitive load

# Item Result

1 Single focus per screen FAIL
2 Chunking, groups of 4 or fewer FAIL
3 Grouping and proximity PASS
4 Visual hierarchy FAIL
5 One thing at a time FAIL
6 4 or fewer visible options per decision FAIL
7 Working memory FAIL
8 Progressive disclosure PASS (partial)
6 failures. HIGH cognitive load.

Single focus, FAIL. post-editor.tsx puts navigating, reordering, duplicating, deleting, exporting, retemplating, text editing, illustration generation, asset picking, per-slide design, and AI regeneration on one screen. Roughly twenty interactive controls with no primary.
Chunking, FAIL. post-editor.tsx:205-245 is a five-button row (Move earlier / Move later / Duplicate / Delete / Download) with no separation between navigation, destruction, and export. brand-kit-form.tsx presents eleven controls in five unlabeled <section> elements.
Hierarchy, FAIL. post-editor.tsx:250 "Slide 1" is text-sm font-medium. post-editor.tsx:350 "Regenerate this slide" is text-sm font-medium. post-editor.tsx:343 "This slide's design" is text-sm font-medium. Three different levels of the tree rendered identically, with the 320px preview, the most important object on the page, given no emphasis at all.
One thing at a time, FAIL. The flow is inherently linear (spec §6) and is presented as a flat surface. Nothing separates "read it" from "fix it" from "ship it."
Decision points exceeding 4 visible options:
Template select, 9 options, post-editor.tsx:274 over templateKinds (types/slide.ts:9-19)
Post type select, 9 options, create-post-form.tsx:124
Regenerate action select, 7 options, post-editor.tsx:360 over regenerateActions (types/slide.ts:189-197)
Tone select, 6 options, create-post-form.tsx:144
Asset type select, 6 options, asset-uploader.tsx:75
Primary font and Secondary font, 5 options each, brand-kit-form.tsx:146
Slide number strip, unbounded, post-editor.tsx:158; spec §9 models a 6-slide carousel
Brand card style, 4, at the limit; illustration style, 5, brand-kit-form.tsx:231
Working memory, FAIL. Nine template names with no visual referent. An invisible icon vocabulary in the visual-hint field. A number strip that carries no state, so after editing four slides the user must remember which ones they touched.
Progressive disclosure, partial PASS. The design panel is in <details> and the asset picker is a Dialog. But regeneration, illustration generation, and the full field set are always expanded. 4. Emotional journey
Peak: the instant the first preview appears at /posts/[postId]. Real typography, the user's colors, a finished-looking slide out of a paragraph of rough text. That is the moment the product is selling and the architecture earns it honestly, because slide-preview.tsx:11-46 renders the identical element Satori exports.

End: a browser download shelf. post-editor.tsx:240-244. No confirmation, no count, no dimensions, no filename, no next step. The product's own success metric (spec §34, "time from idea to publishable post") reaches its finish line and says nothing. Peak-end is inverted: the product peaks in the middle and ends on nothing.

Valleys, in order of encounter:

/ on first visit. "Boilerplate is ready; see tasks.md to start building." (page.tsx:10). The first thing the product says about itself is that it is not finished.
First sign-in. dashboard/page.tsx renders two stacked dashed-border empty states. No onboarding, no route to the Brand Kit that was just seeded, no example. Spec §35's user is standing in an empty room.
The 20-second wait. One static sentence, no progress, no cancel, nothing to look at. create-post-form.tsx:164-168.
First generation arrives branded @yourhandle. The highest-stakes moment in the product, the one that has to prove "this looks like me," and it proves the opposite. types/brand.ts:73 + primitives.tsx:71-83. There is no reassurance here because there is no detection here.
Regenerate-and-lose-my-edits. post-editor.tsx:374-384. A primary-variant button. No warning that it replaces the slide's text. actions.ts:149-172 reads found.slides from the database, so any edit still sitting in the 900ms debounce is silently discarded, and the result overwrites the field content with no undo. The copy at post-editor.tsx:386-388 reassures the user about the other slides while saying nothing about this one.
Delete. post-editor.tsx:232-239. One click, no confirm, no undo, no toast. alert-dialog is not installed. The only guard is slides.length === 1.
Export. Multi-second silence, then a file. And if the user downloaded a single slide first to check it, the post has already flipped to "Exported" (png/route.ts:20) and vanished from Drafts.
Reassurance is present at exactly one high-stakes moment: post-editor.tsx:386-388, "Only this slide changes. The rest of the post stays as it is." That sentence proves the author knows how to do this. It simply is not applied to delete, to export, to brand-kit changes, or to the first generation.

5. Nielsen's 10 heuristics
   Total: 21/40.

# Heuristic Score Key issue

1 Visibility of system status 2/4 export/route.ts renders N PNGs behind a bare <a download> (post-editor.tsx:240-244, page.tsx:79-83) with zero client feedback. The three-stage pipeline in generate-post.ts:22-24 reports no stage. Autosave status is a 12px gray word that clears itself (post-editor.tsx:251-253).
2 Match with the real world 3/4 Copy is plain and human throughout. But page.tsx:53 prints the raw enum ("things i learned"), the format toggle shows "4:5"/"1:1", and "Visual hint" with placeholder database_icon (post-editor.tsx:286-291) is an internal identifier promoted to a label.
3 User control and freedom 1/4 No undo anywhere. Delete has no confirmation (post-editor.tsx:232-239). Regenerate destroys slide content irreversibly. Unsaved keystrokes are dropped on slide switch (editor-state.ts:43-47). Generation cannot be cancelled.
4 Consistency and standards 3/4 Token and primitive use is disciplined. Inconsistencies: <details> (post-editor.tsx:342) beside Card beside bare bordered divs; HTML-entity arrows while lucide-react sits unused; the Brand Kit preview is sticky (brand-kit-form.tsx:290) but the editor preview is not; postTypeLabels exists and is not reused on the post page.
5 Error prevention 2/4 Good: live character counters, Generate disabled below 20 chars (create-post-form.tsx:161), minimum slide count enforced server-side. Bad: unconfirmed delete; regenerate silently discarding in-flight edits; Brand Kit edits retroactively restyling already-exported posts with no notice; no beforeunload guard; hexColorSchema accepts a background/text pair with no readable contrast.
6 Recognition over recall 2/4 Nine templates chosen by name only (post-editor.tsx:264-280). Dashboard posts have no thumbnails (post-card.tsx). The icon vocabulary behind resolveIcon is never shown, so the visual-hint field is guesswork with a paid fallback.
7 Flexibility and efficiency 2/4 No keyboard navigation between slides (arrow keys do nothing). Reordering is one click plus one round trip per position. Format switching is a full navigation that resets to slide 1 (page.tsx:71). No duplicate-post, no regenerate-whole-post, no bulk export selection.
8 Aesthetic and minimalist design 2/4 The slide renderer is genuinely well-composed. The app around it is default shadcn neutral with zero chroma (globals.css:114-134), an identical page template four times over, and roughly twenty flat controls in the editor column.
9 Diagnose and recover from errors 3/4 Errors use role="alert", plain language, and name the failing pipeline stage (posts/new/actions.ts:34). Deductions: Zod paths leak into user-facing strings (actions.ts:39-42); an autosave failure shows a message but leaves the user with no retry affordance and no indication their work is unsaved.
10 Help and documentation 1/4 None. No onboarding, no example content, no template gallery, no tooltips (tooltip is not installed), no explanation of what the visual-hint field accepts, no cost or latency disclosure on illustration generation, no password reset. The lone piece of in-product guidance is post-editor.tsx:293.
No heuristic is n/a. All ten apply to an authenticated task tool.

6. Persona red flags
   Alex, impatient power user
   page.tsx:10: lands on /, reads "see tasks.md to start building," and concludes the product is unfinished before signing in.
   create-post-form.tsx:161-168: 20+ seconds with no progress, no cancel, and no way to open another tab without killing the request. Alex will click Generate twice.
   post-editor.tsx:157-202: no keyboard shortcuts. Moving between six slides is six mouse trips to a row of digits. Arrow keys are inert.
   post-editor.tsx:205-223: moving the final slide from position 6 to position 2 is four clicks, four server actions, four router.refresh() calls.
   posts/[postId]/page.tsx:60-78: checking the square crop navigates the page and dumps Alex back on slide 1.
   post-editor.tsx:240-244: clicks "Download all," sees nothing happen for several seconds, clicks again, triggers a second full Satori render of every slide.
   posts/[postId]/page.tsx:13: the preview is 320px and there is no way to enlarge it. Alex cannot actually verify the typography he is being asked to approve.
   Jordan, confused first-timer
   dashboard/page.tsx:79-103: first screen is two stacked dashed boxes. Two competing calls to action ("Create your first post" and "Set up your Brand Kit") with nothing indicating the second should come first.
   types/brand.ts:73 + primitives.tsx:71-83: Jordan takes the more prominent path, generates a post, and every slide is footed with @yourhandle over a purple-and-black palette that is not hers. Her verdict on "does this look like my account" is formed here, and it is no.
   post-editor.tsx:264-280: sees a "Template" dropdown listing "Cover, Text, Numbered list, Code, Comparison, Quote, Screenshot, Project, Final slide" and has no idea what any of them look like. Changing it is a blind, immediate, irreversible mutation through changeTemplateAction.
   post-editor.tsx:286-293: "Visual hint," placeholder database_icon, help text saying no icon matches and to "try another word," with no list of words. Jordan is stuck in a guessing game.
   post-editor.tsx:294-303: the only visible escape is "Generate illustration," which is styled identically to "Duplicate" and never says it calls a paid image model.
   post-editor.tsx:342-347: a plain <details> labeled "This slide's design." Jordan never opens it and never learns she can change colors or text size.
   post-editor.tsx:251-253: no explicit Save button. The word "Saved" appears briefly in 12px gray and disappears. Jordan does not know whether her work is safe.
   brand-kit-form.tsx:161-180: four raw hex color pickers, no presets, no contrast warning, no guidance. This is the exact task spec §4 says she is bad at, presented with zero assistance.
   No password reset anywhere. If Jordan forgets her password she cannot get back in.
   Riley, deliberate stress tester
   editor-state.ts:43-47: types in slide 1, clicks slide 2 within 900ms, returns to slide 1. The text is gone. No warning, no error, the autosave indicator never fired. Reproducible silent data loss.
   post-editor.tsx:232-239: deletes a slide with one click. No confirm, no undo, no toast. It is gone.
   post-editor.tsx:374-384 + actions.ts:149-172: types a careful rewrite, clicks Regenerate before the debounce fires. The action reads from the database, so the edit is discarded and overwritten by the model. Two losses in one click.
   png/route.ts:20: downloads a single slide to inspect it. The entire post silently transitions to "Exported" and moves between dashboard sections.
   brand/actions.ts:20 + theme.ts:34-36: changes the Brand Kit background to match the text color. hexColorSchema accepts it. Every post, including exported ones, renders invisible text. No warning, no preview of the blast radius.
   posts/[postId]/page.tsx:34-46: opens a post with many slides and waits on N sequential Satori renders with no loading.tsx. A blank screen with no explanation.
   create-post-form.tsx:69-79: closes the tab mid-generation. The OpenAI calls complete server-side and are discarded; nothing is persisted; no trace the attempt happened.
   post-editor.tsx:299: clicks "Generate illustration" repeatedly. Only busy prevents concurrency; each success uploads a new blob and orphans the previous one. No cost surfaced, no rate limit, no confirmation.
   sign-in-form.tsx:57-107: with a screen reader, tab triggers advertise aria-controls pointing at panels that do not exist.
   Project-specific persona: Sam, the developer building a public presence (spec §4, §35)
   Sam ships a feature at 11pm, has one good paragraph about a bug he fixed, and wants a carousel that looks like every other post on his grid. Spec §34 gives him five minutes.

dashboard/page.tsx:61-65 and post-card.tsx: Sam's grid consistency is a visual judgment, and his dashboard is a list of text rows. He cannot see whether his last five posts look like a set. The product's core promise, "every post should feel like it came from the same account" (spec §5), is unverifiable inside the product.
brand-preview.tsx:3-6: the one place he would tune that consistency shows a hand-written fake that ignores card style, illustration style, code block style and logo. He tunes his identity against a preview that is not the renderer.
types/brand.ts:83-85: he configures colors, fonts, radius and voice, leaves the name as "Your brand," and the dashboard keeps telling him his Brand Kit is not set up. He does not trust the product's model of his own state.
post-editor.tsx:161-175: his content is a carousel, an ordered narrative, and the only view of that narrative is a row of digits. He cannot check that the hook leads, the points build, and the CTA lands, because he can never see more than one slide.
post-editor.tsx:264-280: Sam's bug story is a natural Code slide. Picking "Code" from a text dropdown and hoping remapSlide carries his fields is a leap of faith with no undo.
posts/[postId]/page.tsx:13: his code slide renders at fitCodeFontSize inside a 0.296 scale. He cannot read his own snippet in the preview, so he must export to check, which marks the post Exported.
post-editor.tsx:240-244: after five minutes he gets a zip and nothing else. No caption (spec §20, deferred), no reminder of his own CTA, no "open Instagram." He now switches to a file browser, then to his phone, and the product's involvement ends in silence. Spec §34's secondary metric is the percentage of generated posts actually published, and the export moment does nothing to carry him across that line. 7. Strengths

1. The preview/export identity contract is architecturally enforced, not approximated. src/components/slide-preview.tsx:11-46 awaits slideElement(...), the exact element Satori serializes in server/render/slide.tsx, and scales it with a CSS transform. globals.css:7-85 loads the same TTF files the renderer hands to Satori as bytes. This works because it makes drift impossible rather than merely unlikely, and it is the reason the one genuine emotional peak in the product lands. Most tools in this category ship an HTML preview and a separate image pipeline and spend their lives reconciling them.

2. The fitting policy treats the user's writing as the constant and the design as the variable. types/slide.ts:25-56 separates slideTextLimits (targets the prompts quote) from slideTextCeilings (1.6x, what the schema accepts), and theme.ts:89-96 shrinks code to fit rather than clipping. The comment at slide.ts:50 ("Models cannot count characters, and that failed three generations before it measured") shows this was learned, not guessed. This is the product principle, "you should not need design skills," correctly located in the renderer instead of in an error message aimed at the user.

3. The editor's save-correctness model is unusually careful, and the reordering distinction is exactly right. editor-state.ts:22-47 compares state by value signature rather than reference, so a fresh {} cannot loop the autosave, and the draft carries its own slide id so a save can never land on the wrong slide. It is unit-tested. Paired with post-editor.tsx:137-144, which reorders the post while the arrow buttons only change what you look at, and gives each an aria-label that says which it is. That distinction defeats most editors. It is a shame the same rigor stops at the point where the user loses keystrokes by clicking a number.

4. Priority issues
   P0 — The landing page ships build instructions to production
   What. src/app/page.tsx:8-16 renders "Compose / Your personal AI content designer. Boilerplate is ready; see tasks.md to start building." with a "Go to dashboard" button. There is no redirect and no auth check.

Why it matters. It is the first surface at / for every visitor and every signed-in user who types the bare domain. It tells them the product is unfinished and points them at a repo file. It is also the secondary Persuade surface the product has, and it persuades of nothing.

Fix. Either redirect (if (await currentUserId()) redirect("/dashboard"); else redirect("/sign-in");) or build the real landing page. Given spec §33's positioning, the honest version is one screen: the before/after pipeline from spec §2 rendered as two columns, three real generated carousels shown as actual slides (the renderer already produces them), and one CTA. Ten minutes of work for the redirect; do that today regardless of which you pick.

P0 — The editor destroys user work in three separate ways, with no undo
What.

editor-state.ts:43 plus the cleanup at post-editor.tsx:115: keystrokes within the 900ms debounce are dropped when the user switches slides or leaves the page. No warning, no beforeunload.
post-editor.tsx:232-239: Delete fires immediately. No confirmation, no undo, no toast. alert-dialog is not installed.
post-editor.tsx:374-384 with actions.ts:149-172: Regenerate reads slide content from the database, discarding any in-flight edit, then overwrites irreversibly.
Why it matters. This is a tool for people refining copy. Losing a sentence is the worst thing it can do to them, and it currently does so silently in the most common interaction in the app (typing, then clicking another slide).

Fix.

Flush the pending save before any slide switch or destructive action: hoist the debounced payload into a ref and call saveSlideAction synchronously in setActive and at the top of run(). Add a beforeunload guard while a draft signature differs from the server signature.
Install alert-dialog. Gate Delete behind it, naming the slide ("Delete slide 3, the Comparison slide?").
Install and mount sonner (it is already a dependency and ui/sonner.tsx already exists, unmounted). After delete and after regenerate, show a toast with an Undo action. Both are trivially reversible server-side: delete needs a soft-delete or a client-held snapshot; regenerate needs the previous content retained, which actions.ts:144 already has in hand as target.content.
Precede Regenerate with the same sentence pattern already used at post-editor.tsx:386: "This replaces the text on this slide. Your other slides stay as they are."
P0 — The first real export is branded with a placeholder handle
What. types/brand.ts:73 seeds username: "@yourhandle". primitives.tsx:71-83 draws that string in the footer of every slide. Nothing in posts/new, the editor, or either export route checks whether the Brand Kit is still the seed. isDefaultBrandKit (types/brand.ts:83-85) exists but is consulted only by the dashboard, and it tests only name and username.

Why it matters. It fails the product's stated core principle (spec §5) at the exact moment the principle is first tested, and it produces PNGs the user cannot publish. The failure is invisible until the artifact exists, which is the most expensive place to discover it.

Fix.

Rewrite isDefaultBrandKit to compare the whole kit against defaultBrandKit by deep equality, so a partially configured kit counts as configured.
Add a persistent banner on /posts/new when the kit is still the seed: "Your posts will be signed @yourhandle. Set your Brand Kit first," with a link. Do not block, warn.
Block the export routes on a still-default username, or substitute the account name. Shipping a placeholder handle into a downloaded file is worse than a refused download.
Route new users to /brand after sign-up. Better Auth already seeds the kit at user.create.after; redirect to it once.
P1 — The Brand Kit, the product's differentiator, previews a slide the renderer never produces
What. brand-preview.tsx:3-6 still says "Stand-in for the real renderer (Phase 6)." Phase 6 shipped and tasks.md:52 is checked off. The stub is hand-written Tailwind, so card style, illustration style, code block style, logo, radius-on-surfaces, and the real type scale produce no feedback at all. Six of eleven controls in brand-kit-form.tsx are adjusted blind.

Why it matters. Spec §5 and §33 make visual identity the entire differentiator. The one screen where the user authors that identity lies to them about what it will look like.

Fix.

Replace BrandPreview with SlidePreview driven by the fixtures that already exist in src/templates/fixtures.ts. Show three at once (Cover, Code, Numbered list) so card style, code block style and illustration style are all visible. The page is a server component; the form is client. Pass the previews down as ReactNode[] exactly as posts/[postId]/page.tsx:34-46 already does, keyed on the kit so they re-render on change (debounced).
Add starter palettes. Four named looks ("Minimal dark," "Editorial light," "Terminal," "Warm") that set colors, fonts, radius and card style in one click. Spec §4 says this user is not good at graphic design; four raw hex pickers is the wrong tool for that person.
Contrast-check background against text in brandKitSchema or the form and warn below 4.5:1.
Disclose the blast radius on save: "This restyles all 12 of your posts, including exported ones."
P1 — A visual product hides visuals at every decision point, and never says "done"
What.

post-card.tsx:15-23: dashboard posts are text rows. No thumbnail.
post-editor.tsx:264-280: nine layouts chosen from a text dropdown.
post-editor.tsx:157-175: the carousel sequence is a row of digits.
posts/[postId]/page.tsx:13: the preview is hard-coded at 320px with no zoom. Body copy renders at 9.5px.
post-editor.tsx:240-244 and page.tsx:79-83: export is a bare <a download> with no pending state and no success state.
Why it matters. Every one of these is a moment where the user must judge appearance, and appearance is withheld. Combined they are why the app reads as generic CRUD despite a strong renderer sitting one import away. The export gap specifically inverts peak-end: the product's last impression is silence.

Fix.

Cache the first slide's PNG per post (the route exists at /api/posts/[postId]/slides/[slideId]/png) and use it as the PostCard thumbnail at 4:5. The dashboard becomes the grid-consistency check Sam needs, at near-zero cost.
Replace the template dropdown with a 3x3 grid of miniature renders from src/templates/fixtures.ts. Recognition instead of recall, and it turns the most confusing control into the most reassuring one.
Replace the number strip with a filmstrip of the previews that are already rendered and in the DOM (post-editor.tsx:188-192 renders all of them and hides all but one). Rendering them at 64px in a strip costs nothing extra and gives the user their carousel's arc.
Make the preview responsive: min(520px, available) with a click-to-enlarge dialog at full 1080. dialog is installed.
Convert export to a client component with a pending state and a completion panel: thumbnails of what was exported, the count, the dimensions, the filename, and the CTA text from the final slide ready to copy. That is the peak-end fix, and it is the cheapest lever on spec §34's secondary metric. 9. Minor observations
src/components/ui/skeleton.tsx and src/components/ui/sonner.tsx are installed and never used. next-themes is a dependency imported only by the unmounted Toaster. lucide-react is a dependency with zero icons in the app UI.
tooltip and alert-dialog are not installed, and both are needed (disabled-state explanations; destructive confirmation).
Dark mode is fully tokenized at globals.css:136-155 and completely unreachable. No ThemeProvider, no toggle, nothing applies .dark.
No loading.tsx, error.tsx, not-found.tsx, or global-error.tsx exist anywhere in src/app. Every await blocks bare, and notFound() at posts/[postId]/page.tsx:29 renders the stock Next.js page.
sign-in-form.tsx:57-107: Tabs without TabsContent leaves dangling aria-controls on both triggers.
No password reset path exists.
posts/[postId]/page.tsx:53 prints the raw enum lowercase while create-post-form.tsx:19-28 holds correct labels. Move postTypeLabels to src/types/post.ts and use it in both places.
Format toggle shows "4:5" / "1:1" with no words. Use "Carousel" / "Square"; the ratios can be secondary text.
app-nav.tsx:21 exact-matches pathname, so /posts/[id] highlights nothing. Add prefix matching and a breadcrumb back to the dashboard from the editor.
Format switching is a <Link> navigation that resets the active slide to 0 (posts/[postId]/page.tsx:71). Preserve the index in the URL or move format to client state.
post-editor.tsx:185,201 use &larr;/&rarr; as button content. Use ChevronLeft/ChevronRight.
post-editor.tsx:342 is an unstyled <details> among Cards. Users will not find per-slide design controls.
post-editor.tsx:205-245 puts Delete between Duplicate and Download in one undifferentiated row. Separate destructive actions.
asset-uploader.tsx:53-60 is a raw file input. Add paste-from-clipboard; screenshots are the dominant asset for this user and they arrive on the clipboard.
Generated illustrations (actions.ts:217-220) never enter the Asset library, so a good result cannot be reused. Spec §16 wants them there.
actions.ts:39-42 and posts/new/actions.ts:20-21 leak Zod issue paths into user-facing strings.
empty-state.tsx has no visual. Three can stack on an empty dashboard. Give the first-post state a real sample carousel and a "Try this example" button that prefills create-post-form with the spec §7 debugging paragraph.
dashboard/page.tsx:50 puts the product's own success metric in 12px muted text under the page title, where nobody will read it. Either commit to it or drop it.
post-editor.tsx:299 guards concurrent illustration generation only with busy, shared across every action in the component, so the label reads "Working..." for unrelated operations.
slide-fields.tsx:27 derives input ids from labels. It happens not to collide today, but a future template with two same-named fields produces duplicate DOM ids silently.
slide-design.tsx:39 labels a color input "Background colour" while the rest of the product uses American spelling ("color"). slide-design.tsx:86 renders "Centre". Pick one; AGENTS.md does not specify, the codebase is otherwise American.
The template registry supports nine layouts, but nothing lets the user save a successful design as a reusable template. Deferred to Backlog (tasks.md:123, spec §15). Recommend it anyway: it is the mechanism by which "consistently good" becomes true over time, and it is cheap once designConfig and PostSpec already exist.
Caption generation is deferred (spec §20, tasks.md:124). Recommend surfacing it at the export moment specifically. The completion panel is where a caption is worth the most, and its absence is a direct drag on spec §34's secondary metric. 10. Provocative questions
Why is the carousel the one thing the carousel editor never shows? Every design decision the user makes is about sequence, and the sequence is represented by the numerals 1 through 6.
If the Brand Kit is the differentiator, why is it the fourth nav item, behind Assets in importance and behind a dropdown-and-hex-field form in ambition? Spec §5 says the product has two concepts, Content Intelligence and Visual Identity. One of them got a three-stage AI pipeline with versioned prompts. The other got a settings page with a fake preview.
The renderer measures glyph advances to guarantee the type fits. Why does the preview then shrink that type to 9.5px, the one size at which the user cannot evaluate it? The product went to extraordinary lengths to make the output correct and then declined to let the user see it.
What is the product's own visual identity? A tool that sells taste has zero chroma in its palette (globals.css:114-134), one type size per role, and no icon anywhere. The renderer proves the authors can design. Why does the app refuse to?
Spec §34's secondary metric is the share of generated posts actually published. What in this interface moves that number? The flow ends at a browser download shelf. Every remaining step to a published post happens outside the product, unassisted.
Why does the product ask the user to type database_icon at all? The AI already produced the visual hint, resolveIcon already has a fixed vocabulary, and the fallback is a paid image generation. Show the icons and let the user click one.
Does the editor believe in autosave? It debounces, it flashes "Saved" in 12px gray, then it clears the word, offers no undo, and drops keystrokes on slide switch. That is not autosave, it is a save that happens sometimes.
Why does inspecting one slide mark the whole post exported (png/route.ts:20)? A read operation with a state-mutating side effect that rearranges the dashboard is a decision, not an oversight. What was it optimizing for?
result: Design review of Compose delivered. Verdict: the slide renderer is genuinely well-authored, the signed-in UI is interchangeable shadcn CRUD. Nielsen 21/40, cognitive load HIGH (6 of 8 failures). Three P0s: src/app/page.tsx:10 ships "see tasks.md to start building" to production; the editor silently drops in-flight keystrokes on slide switch (editor-state.ts:43) with unconfirmed delete and destructive regenerate and no undo anywhere; and the first real export is branded @yourhandle (types/brand.ts:73 into primitives.tsx:71-83). Two P1s: the Brand Kit, the stated differentiator, still previews through a Phase-6 stub (brand-preview.tsx:3-6) that ignores six of eleven controls, and a visual product shows no visuals at any decision point (no post thumbnails, nine templates as a text dropdown, a 320px preview rendering body copy at 9.5px) while export ends in silence with no completion moment.

Design review is in — it's substantial. Waiting on the detector and technical-evidence pass before I synthesize.

Sanity check done: detector ran to completion (exit 2), npx tsc --noEmit exits 0, npx vitest run passes 218/218 tests across 13 files. Full evidence below.

(a) Detector scan
node C:\Users\USER\.claude\skills\impeccable\scripts\detect.mjs --json src/app src/components → exit code 2, 4 findings, 1 distinct rule.

# Rule Severity Category Location Snippet

1 overused-font warning slop src/app/globals.css:8 font-family: "Inter
2 overused-font warning slop src/app/globals.css:16 font-family: "Inter
3 overused-font warning slop src/app/globals.css:24 font-family: "Space Grotesk
4 overused-font warning slop src/app/globals.css:32 font-family: "Space Grotesk
All four carry importedBy: ["layout.tsx"]. Zero findings in any .tsx file.

(b) False positives
All 4 overused-font findings are false positives as stated, but they mask a real separate fact.

Reason: src/app/globals.css:6 carries the comment "Brand Kit fonts. The slide preview needs the same files Satori renders with." Lines 7-84 are ten @font-face declarations for the user-selectable Brand Kit font list (src/types/brand.ts fontFamilies), which are rendered into the exported PNG slides, not used for application chrome. The detector's importedBy: ["layout.tsx"] inference is mechanically correct (globals.css is imported by layout.tsx) but semantically wrong — these faces never style the app UI. The set is deliberately fixed and surfaced to the user at src/app/(app)/brand/brand-kit-form.tsx:155-157: "Only these fonts can be rendered into a PNG, so the list is fixed."

The app's own UI typeface is not flagged because it is not in CSS: src/app/layout.tsx:2,5-13 loads Geist and Geist Mono via next/font/google, wired to --font-geist-sans / --font-geist-mono at globals.css:87-88. Geist is on the detector's own overused list; it is simply declared in a file the scan does not attribute.

(c) Browser attempt
Ran: checked node_modules/playwright, node_modules/puppeteer, node_modules/@playwright, node_modules/playwright-core — none exist. Read package.json in full: no browser driver in dependencies or devDependencies (nearest testing dep is vitest ^5.0.0, no jsdom/happy-dom either).
Skipped, and why: pnpm dev, port wait, route navigation, 1440x900 and 390x844 screenshots, and any overlay injection — all skipped because no driver is present and the brief forbids installing one. No dev server was started, therefore none needed killing.
No screenshots exist. No overlay exists. Every responsive and layout number below is computed from source, not observed.
Fallback signal: the app would in any case have hit the auth wall — src/app/(app)/layout.tsx:9 calls requireUserId() on every signed-in route, and src/server/db/client.ts requires DATABASE_URL via src/lib/env.ts.
(d) Static technical evidence
Accessibility
Non-semantic click handlers: zero. All 17 onClick occurrences in src/app + src/components are on <Button> or a native <button>. The one <li> near a handler (src/components/asset-picker.tsx:42) wraps a real <button type="button"> at line 43. No div/span click targets anywhere.

Form field labelling: every field is labelled. Count = 0 unlabelled.

sign-in-form.tsx:72-73 (name), :78-79 (email), :83-84 (password) — <Label htmlFor> + matching id, plus autoComplete on all three and minLength={8} on password.
create-post-form.tsx:85-86 (content), :101-102 (context), :114-120 (postType), :134-140 (tone).
asset-uploader.tsx:52-53 (file), :64-65 (name), :69-71 (type).
asset-list.tsx:105-106 (assetName).
brand-kit-form.tsx:97-99, :106-108, :133-142 (×2 fonts), :161-163 + :172-177 (×4 colors), :185-186 (radius), :197-204 (cardStyle), :218-228 (illustrationStyle), :242-249 (codeBlockStyle), :264-265 (voice), and AssetUrlField :51-55 (logoUrl, avatarUrl).
post-editor.tsx:263-270 (template), :286-287 (visual).
slide-design.tsx:35-44 (3 color inputs, each with both htmlFor and an aria-label), :61-64 (fontScale).
slide-fields.tsx:27,33,39,47 — Field derives id from the label text (label.toLowerCase().replaceAll(" ", "-")) and passes it to both <Label htmlFor> and the control. I checked every template branch for id collisions within a single rendered page: none (heading, body, left-label, right-label, item-1, item-1-detail, …, plus visual/template from post-editor and backgroundColor/textColor/accentColor/fontScale from slide-design are all distinct).
Two <Select> without a visible label both carry an alternative: post-status.tsx:40 has aria-label="Post status"; post-editor.tsx:356 (regenerate action) has neither aria-label nor htmlFor — the single unlabelled control in the codebase, sitting under the plain <p> "Regenerate this slide" (post-editor.tsx:350, a <p>, not a label). The free-text <Input> beneath it at post-editor.tsx:368-372 is also unlabelled (placeholder-only: "Optional. Make this slide less wordy.").
Icon-only buttons. Only two exist, both labelled:

post-editor.tsx:178-186 and :194-202 — size="icon", children are the HTML entities &larr; / &rarr;, each with aria-label="View the previous slide" / "View the next slide".
app-nav.tsx has no buttons at all (4 text <Link>s, lines 8-13). slide-fields.tsx and asset-list.tsx have no icon-only buttons — all are text ("Add item", "Remove item", "Edit", "Rename", "Delete").
dialog.tsx:63-69 — the close button is icon-only but has <span className="sr-only">Close</span>. This is the only sr-only in the codebase.
<img> tags: zero in src/app and src/components. Both image sites use next/image: asset-list.tsx:61-67 (alt={row.name}, fill, sizes="(max-width: 640px) 100vw, 33vw") and asset-picker.tsx:52-58 (alt={asset.name}, fill, sizes="33vw"). No decorative images, so no alt="" case arises.

Heading structure — exactly one h1 per route, no level skips:

Route h1 h2
/ page.tsx:8 "Compose" —
/sign-in none —
/dashboard dashboard/page.tsx:49 "Your Content" :59 Drafts, :70 Recent Posts, :95 Brand Kit
/posts/new posts/new/page.tsx:6 "Create a post" —
/posts/[postId] [postId]/page.tsx:55 {post.title} post-editor.tsx:250 "Slide N"
/brand brand/page.tsx:12 "Brand Kit" —
/assets assets/page.tsx:13 "My Assets" —
/sign-in has no h1: sign-in-form.tsx:53 renders the page title through <CardTitle>, which ui/card.tsx:30-34 implements as a <div>, not a heading element. Also note dashboard/page.tsx:95 <h2>Brand Kit</h2> and brand/page.tsx:12 <h1>Brand Kit</h1> — the same string at two levels.

Tabs without panels. sign-in-form.tsx:10 imports only Tabs, TabsList, TabsTrigger; TabsContent is exported at ui/tabs.tsx:80 but never used. The <form> at :69 is a sibling inside <Tabs> but outside any panel. Radix TabsTrigger emits aria-controls pointing at a tabpanel id that is never rendered — a dangling aria-controls on both triggers (:65, :66).

Focus management. focus-visible appears in exactly 7 files (1 occurrence each): ui/button.tsx:8 (focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]), ui/input.tsx:11, ui/textarea.tsx:9, ui/select.tsx:33, ui/tabs.tsx:59, plus two hand-rolled rings: app-nav.tsx:29 and post-editor.tsx:166 (both focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none).

outline-none appears 8 times; in every case a focus-visible ring replaces it in the same class string. globals.css:172-176 also sets a global outline-ring/50 on *.
Dialogs use Radix (ui/dialog.tsx), which supplies the focus trap and focus return. asset-list.tsx:110 adds autoFocus to the rename input. No custom focus logic exists anywhere, so no hand-rolled trap to audit.
post-editor.tsx:189 hides non-active slide previews with the hidden attribute (correct — removed from the a11y tree), not CSS.
Live regions — 2 aria-live, 6 role="alert", 0 role="status", 0 aria-busy:

post-editor.tsx:251 <span aria-live="polite"> announcing busy ? "Working" : (status ?? "") — covers autosave ("Saving"/"Saved") and every transition.
create-post-form.tsx:165 <span aria-live="polite"> for the ~20s generate wait.
role="alert": asset-list.tsx:93, asset-uploader.tsx:89, brand-kit-form.tsx:283, create-post-form.tsx:155, post-editor.tsx:257, sign-in-form.tsx:98.
Unannounced states: brand-kit-form.tsx:281 {status.saved && <span className="text-muted-foreground text-sm">Saved.</span>} — plain <span>, no live region, so a successful Brand Kit save is silent to a screen reader (the error branch two lines down at :283 does have role="alert"). post-status.tsx has no status output at all. sign-out-button.tsx:22 swaps text to "Signing out..." with no live region.
Toasts are entirely unused. sonner is a dependency and src/components/ui/sonner.tsx exists (40 lines, configured with 5 lucide icons and popover-token styling), but grep for Toaster / from "sonner" / toast( across all of src matches only that file's own definition. <Toaster /> is mounted in neither src/app/layout.tsx nor src/app/(app)/layout.tsx. Sonner's built-in live region therefore never renders; all error surfacing is the inline role="alert" paragraphs above. ui/sonner.tsx is dead code, and it is also the only importer of next-themes.
Error association: zero. aria-invalid and aria-describedby appear only as Tailwind variant selectors inside primitives (ui/input.tsx:12, ui/textarea.tsx:9, ui/select.tsx:33) — no call site ever sets either attribute. Concretely: create-post-form.tsx:161 disables submit on tooShort || tooLong and renders the counter at :95-97, but the <Textarea id="content"> at :86 gets no aria-invalid and no aria-describedby pointing at the counter or at the role="alert" at :155. Same in slide-fields.tsx:34 — the over-limit counter turns text-destructive but the Input/Textarea at :39/:47 are never marked invalid or described-by.

Color-only meaning — 3 instances:

slide-fields.tsx:34: <span className={over ? "text-destructive text-xs" : "text-muted-foreground text-xs"}> — over-limit is signalled by color change alone; the text {value.length}/{max} is identical in both states.
create-post-form.tsx:95: className={tooLong ? "text-destructive text-xs" : "text-muted-foreground text-xs"} — same pattern.
Post status: not color-only. post-card.tsx:5-9,21 renders the literal word ("Draft"/"Ready"/"Exported") in text-muted-foreground; there is no colored badge component in the codebase.
dashboard/page.tsx:109-119 renders 3 brand colors as size-6 rounded-full swatches with no text or aria-label; they are inside a <Link> whose accessible name comes from {brandKit.name} at :121.
Touch targets (computed from Tailwind v4 defaults, 1rem = 16px):

Element Classes Height vs 44px
Button default ui/button.tsx:20 h-9 36px −8
Button size="sm" ui/button.tsx:21 h-8 32px −12 (19 usages)
Button size="icon" ui/button.tsx:22-23 size-9 36×36px −8 (2 usages)
SelectTrigger default ui/select.tsx:33 data-[size=default]:h-9 36px −8
SelectTrigger size="sm" data-[size=sm]:h-8 32px −12 (post-status.tsx:40)
Nav links app-nav.tsx:29 px-3 py-1.5 text-sm 20 + 12 = 32px −12
Slide number chips post-editor.tsx:166 px-2.5 py-1 text-xs 16 + 8 = 24px; width ≈ 8+20 = ~28px −20 / −16
Dialog close ui/dialog.tsx:65 icon size-4, no padding class 16×16px −28
Color swatches slide-design.tsx:43, brand-kit-form.tsx:170 size-9 … p-1 36×36px −8
Variant/size tally: size="sm" ×19, size="icon" ×2, size="lg" ×0, default ×(remainder). Nothing in the app reaches 44px.

prefers-reduced-motion: zero occurrences in the entire src/ tree (also zero motion-reduce:). Animation that runs unconditionally: tw-animate-css enter/exit on ui/dialog.tsx:56, ui/select.tsx:58, ui/dropdown-menu.tsx:35,203 (fade-in-0 zoom-in-95 slide-in-from-*, duration-200); animate-pulse in ui/skeleton.tsx:7; animate-spin in ui/sonner.tsx:25; transition-colors / transition-all across button.tsx:8, app-nav.tsx:29, post-card.tsx:17, post-editor.tsx:166, asset-picker.tsx:49, dashboard/page.tsx:107.

Color contrast (computed)
Method: oklch → oklab (inverse LMS cube) → linear sRGB (Björn Ottosson matrix) → clamp to gamut → sRGB. Relative luminance per WCAG 2.x from linear components; border/input in dark are oklch(1 0 0 / 10%) and / 15%, composited over their backdrop in gamma-encoded space (as a browser does) before luminance. Tokens from globals.css:110-129 (:root) and :131-150 (.dark).

Resolved hex — LIGHT: background #ffffff, foreground #0a0a0a, card #ffffff, primary #171717, primary-foreground #fafafa, secondary/muted/accent #f5f5f5, muted-foreground #737373, destructive #e7000b, border/input #e5e5e5, ring #a1a1a1.

Resolved hex — DARK: background #0a0a0a, foreground #fafafa, card/popover #171717, primary #e5e5e5, primary-foreground #171717, secondary/muted/accent #262626, muted-foreground #a1a1a1, destructive #ff6467, border #ffffff @ 10%, input #ffffff @ 15%, ring #737373.

Pairing Threshold LIGHT LIGHT DARK DARK
foreground / background 4.5 19.79:1 PASS (AAA) 18.96:1 PASS (AAA)
card-foreground / card 4.5 19.79:1 PASS (AAA) 17.16:1 PASS (AAA)
muted-foreground / background 4.5 4.73:1 PASS (margin +0.23) 7.63:1 PASS (AAA)
muted-foreground / card 4.5 4.73:1 PASS (margin +0.23) 6.91:1 PASS
muted-foreground / muted 4.5 4.34:1 FAIL (−0.16) 5.83:1 PASS
foreground / muted 4.5 18.15:1 PASS (AAA) 14.48:1 PASS (AAA)
primary-foreground / primary 4.5 17.16:1 PASS (AAA) 14.22:1 PASS (AAA)
primary / background 3.0 17.91:1 PASS (AAA) 15.72:1 PASS (AAA)
secondary-foreground / secondary 4.5 16.42:1 PASS (AAA) 14.48:1 PASS (AAA)
accent-foreground / accent 4.5 16.42:1 PASS (AAA) 14.48:1 PASS (AAA)
destructive / background 4.5 4.76:1 PASS (margin +0.26) 6.84:1 PASS
destructive / card 4.5 4.76:1 PASS 6.19:1 PASS
white / destructive (button fill) 4.5 4.76:1 PASS 6.84:1 PASS
border / background 3.0 1.26:1 FAIL (−1.74) 1.25:1 FAIL (−1.75)
border / card 3.0 1.26:1 FAIL 1.32:1 FAIL
input / background 3.0 1.26:1 FAIL (−1.74) 1.47:1 FAIL (−1.53)
ring / background 3.0 2.59:1 FAIL (−0.41) 4.18:1 PASS
ring / card 3.0 2.59:1 FAIL (−0.41) 3.79:1 PASS
Notes tied to actual usage:

The border/input 1.26:1 failure is the highest-traffic one — it is the boundary of every Input (ui/input.tsx:10 border-input), every Textarea, every SelectTrigger, and every bordered container (post-card.tsx:17, empty-state.tsx:15, slide-preview.tsx:32, asset-list.tsx:59, post-editor.tsx:342,349, slide-fields.tsx:105,204, the (app)/layout.tsx:13 header rule).
ring / background 2.59:1 in light affects the two hand-rolled focus rings that use full-opacity ring-ring (app-nav.tsx:29, post-editor.tsx:166). The shadcn primitives use ring-ring/50 at ring-[3px], which composites to a lower ratio still (~1.7:1 over white).
muted-foreground / muted (4.34:1 FAIL) is not currently realized with text. bg-muted appears at exactly two app-level sites — asset-list.tsx:60 and asset-picker.tsx:51 — both are aspect-[4/3] image wells containing only an <Image>, no text. bg-accent (app-nav.tsx:31, post-editor.tsx:168) always pairs with text-accent-foreground (16.42:1). Reporting the number as computed; flagging that it is latent, not live.
text-muted-foreground at small sizes — 22 app-level occurrences, all at 4.73:1 in light: 14 with text-xs (12px) and 8 with text-sm (14px). Locations: dashboard/page.tsx:50,60,100(desc),122; post-card.tsx:20; [postId]/page.tsx:52; post-editor.tsx:169,251,293,386; slide-fields.tsx:34; create-post-form.tsx:95,165; brand-kit-form.tsx:155,272,281,291; asset-list.tsx:72; asset-picker.tsx:36; empty-state.tsx:17; assets/page.tsx:14; brand/page.tsx:13; posts/new/page.tsx:7; plus page.tsx:9 at text-lg. None of these qualify as "large text" (needs ≥18.66px bold or ≥24px), so 4.5:1 is the applicable bar for all 22 — passing by 0.23.

Dark palette is unreachable at runtime. globals.css:4 defines @custom-variant dark (&:is(.dark *)), so every dark token and every dark: utility is gated on a .dark ancestor class. Grep across all of src for ThemeProvider, classList.add, data-theme, or a literal "dark" class returns only src/types/brand.ts:21,78 (the Brand Kit codeBlock style enum) and src/server/render/highlight.test.ts — i.e. the slide code-block theme, unrelated to app chrome. src/app/layout.tsx:27 renders <html lang="en"> with no class and no provider. next-themes is installed and imported only by the never-mounted ui/sonner.tsx:10. There is also no prefers-color-scheme media block. The entire DARK column above is dead code today.

Responsive
Breakpoint usage across src/app + src/components: sm: ×20, lg: ×9, md: ×2 (both are the md:text-sm font-size step inside ui/input.tsx:10 and ui/textarea.tsx:9). No xl: or 2xl:. No md: layout rule exists anywhere — layouts jump straight from sm (640px) to lg (1024px).

Hardcoded/fixed dimensions:

[postId]/page.tsx:13 — const previewWidth = 320; passed to SlidePreview, landing as inline style={{ width: 320 }} at slide-preview.tsx:33. The source comment claims "320 plus the page gutters still fits a 400px screen."
post-status.tsx:40 — className="w-32" (128px) on the status SelectTrigger.
asset-uploader.tsx:71 — w-full sm:w-40 (160px above sm).
asset-picker.tsx:40 — max-h-[60vh].
ui/dropdown-menu.tsx:35,203 and ui/select.tsx:58 — min-w-[8rem] (128px), fits 390px.
ui/tabs.tsx:59 — h-[calc(100%-1px)]; :62 bottom-[-5px].
Page shells: max-w-5xl ×4 (assets, brand, dashboard, (app)/layout), max-w-2xl ×2, max-w-6xl ×1 ([postId]/page.tsx:49), all with mx-auto px-6. All are max-widths, harmless at 390px.
The measured 390px problem — post-editor.tsx:177-203:

<div className="flex items-center gap-3">   // no flex-wrap
  <Button size="icon" .../>                 // size-9 = 36px, .shrink-0 from button.tsx:8
  {previews.map(...)}                       // wrapper div, contains width:320px preview
  <Button size="icon" .../>                 // 36px, shrink-0
</div>
Required intrinsic width = 36 + 12 (gap-3) + 320 + 12 + 36 = 416px. Available at a 390px viewport = 390 − 48 (px-6 gutters on [postId]/page.tsx:49) = 342px. Deficit = 74px. Both buttons carry shrink-0, so the only element that can absorb it is the preview wrapper; whether that clips the preview or pushes the page into horizontal scroll depends on the flex min-content resolution of the overflow-hidden child at slide-preview.tsx:32 and cannot be settled without a browser. Either way the 320px preview cannot be shown intact alongside both arrows at 390px. The previewWidth comment's "fits a 400px screen" arithmetic accounts for the gutters but not for the two 36px arrows and two 12px gaps flanking it.

Grid/flex layouts and their breakpoints:

Location Classes Below first breakpoint
post-editor.tsx:155 grid gap-10 lg:grid-cols-[420px_1fr] single column < 1024px — the two-pane editor stacks correctly; no md: step, so the 640–1023px band gets the 1-column phone layout
brand-kit-form.tsx:93 grid gap-10 lg:grid-cols-[1fr_auto] single column < 1024px; the lg:sticky lg:top-10 preview (:290) is non-sticky below
dashboard/page.tsx:61,72 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 1 col < 640px
asset-list.tsx:57 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 1 col < 640px
asset-uploader.tsx:49 grid gap-4 … sm:grid-cols-[1fr_1fr_auto] sm:items-end stacks < 640px
create-post-form.tsx:112 grid gap-4 sm:grid-cols-2 stacks
brand-kit-form.tsx:95,130,160,183 grid gap-4 sm:grid-cols-2 ×4 stack
asset-picker.tsx:40 grid gap-3 … sm:grid-cols-3 1 col
[postId]/page.tsx:50,58 flex flex-wrap wraps
post-editor.tsx:157,205,294 flex flex-wrap wraps
ui/dialog.tsx:56 w-full max-w-[calc(100%-2rem)] … sm:max-w-lg correctly bounded
Horizontal-scroll risk beyond the editor row: whitespace-nowrap is set in ui/button.tsx:8 (every button), ui/select.tsx:33 (every trigger), ui/tabs.tsx:59. Long unbroken strings are guarded in 3 of 4 places — truncate at asset-list.tsx:71 and asset-picker.tsx:60, line-clamp-2 at post-card.tsx:19 — but [postId]/page.tsx:55 renders {post.title} in an h1 with no truncate, line-clamp, or break-words, and there are zero break-* utilities in the codebase. No <table> anywhere. Code content lives in a Textarea (slide-fields.tsx:39,44 with font-mono text-xs), which wraps.

app-nav.tsx mobile treatment: none — it relies on wrapping only. :19 is flex flex-wrap items-center gap-1 with 4 text links; the parent header at (app)/layout.tsx:14 is flex flex-wrap items-center gap-x-6 gap-y-2. No hamburger, no <Sheet>/drawer (neither is installed), no sm:/md:/lg: class in either file, no hidden/md:flex toggle. At 390px the header's four links ("Dashboard", "Create Post", "Brand Kit", "Assets" at text-sm px-3 ≈ 335px + gaps) plus the "Compose" wordmark (:15) and the ml-auto Sign out button (:19-21, size="sm") exceed the 342px content box and wrap to 2–3 rows. Note also that ml-auto on the sign-out wrapper stops doing anything useful once the row wraps.

States & loading
Pending state per mutation — 14 server actions across 4 actions.ts files:

Action Call site Pending state
createPostAction create-post-form.tsx:71 ✅ useTransition :49, button :161-162, live text :164-168
saveBrandKitAction brand-kit-form.tsx:89 ✅ useTransition :80, button :278-279
uploadAssetAction asset-uploader.tsx:39 ✅ useTransition :31, button :84-85
renameAssetAction asset-list.tsx:42 ✅ useTransition :29, button :114-115
deleteAssetAction asset-list.tsx:50 ⚠️ shares pending :29, which only disables the "Edit" trigger at :76; the DropdownMenuItem at :82 has no disabled/pending state and no text or spinner changes anywhere while the delete is in flight
setPostStatusAction post-status.tsx:35 ✅ useTransition :26, disabled={pending} :31
saveSlideAction post-editor.tsx:101 ✅ sets status "Saving"/"Saved" :100,111, surfaced at :251-253
changeTemplateAction post-editor.tsx:267 ⚠️ routed through run() (:126-135, sets busy), but the SelectTrigger at :270 is never given disabled={busy} — the only control in the editor not gated
duplicateSlideAction post-editor.tsx:228 ✅ disabled={busy} :227
deleteSlideAction post-editor.tsx:236 ✅ disabled={busy} :235
moveSlideAction post-editor.tsx:143 ✅ disabled={busy || …} :210,219
regenerateSlideAction post-editor.tsx:379 ✅ disabled={busy} :376, label swap :383
generateIllustrationAction post-editor.tsx:300 ✅ disabled={busy} :299, label swap :302
removeIllustrationAction post-editor.tsx:310 ✅ disabled={busy} :309
Non-action mutations: authClient.signIn/signUp (sign-in-form.tsx:37-38) ✅ setPending :24; authClient.signOut (sign-out-button.tsx:15) ✅ useState :11.
Client files with zero pending machinery: slide-design.tsx, slide-fields.tsx, app-nav.tsx, asset-picker.tsx (all pure-local-state, no mutations — correct).

Route-level special files: error.tsx = 0, loading.tsx = 0, not-found.tsx = 0, global-error.tsx = 0, template.tsx = 0. find src/app -name "loading.tsx" -o -name "error.tsx" -o -name "not-found.tsx" -o -name "global-error.tsx" returns nothing. Every route — /, /sign-in, /dashboard, /posts/new, /posts/[postId], /brand, /assets — has none of the three. There is no middleware.ts either.
This is load-bearing in one place: [postId]/page.tsx:29 calls notFound() with no not-found.tsx at any level, so a missing/foreign post falls through to the framework default page rather than anything in this design system.

Suspense / skeletons: zero. grep "Suspense" across src/app + src/components → no matches. src/components/ui/skeleton.tsx exists (13 lines) and is never imported — the only three matches for "Skeleton" in the whole tree are its own definition, its data-slot, and its export. Every route is a fully-awaited async server component (dashboard/page.tsx:36-41 awaits 4 queries via Promise.all; [postId]/page.tsx:24-27 awaits 2, then :34-46 awaits a Promise.all over every slide render) with no streaming boundary, so each navigation blocks on the full server work before any markup renders.

Destructive actions — no confirmation anywhere. alert-dialog is not installed. src/components/ui/ contains 11 files (button, card, dialog, dropdown-menu, input, label, select, skeleton, sonner, tabs, textarea) — no alert-dialog.tsx. Grep for AlertDialog and confirm( across src/app + src/components → zero matches. The three destructive paths all fire on first click:

asset-list.tsx:81-84 — <DropdownMenuItem variant="destructive" onSelect={() => remove(row)}>Delete</DropdownMenuItem> deletes the asset (and per deleteAssetAction, the blob) immediately.
post-editor.tsx:232-239 — Delete (a variant="outline" button, guarded only by slides.length === 1) removes the slide immediately.
post-editor.tsx:374-384 — Regenerate overwrites the current slide's hand-edited copy via regenerateSlideAction. The only warning is the text-xs line at :386-388 ("Only this slide changes"), which describes blast radius, not the loss of local edits. Note the interaction with autosave: :96-116 writes the draft to the server after a 900ms pause, so edits are already persisted and then overwritten. No undo/restore action exists in any of the 14 server actions.
Optimistic updates: zero. useOptimistic and useFormStatus have no occurrences anywhere in src. Every mutation is: await the server action → router.refresh(). The one place with an optimistic flavor is post-status.tsx:33 (setValue(next) before the transition) and post-editor.tsx:142 (setActive(target) before moveSlideAction), both local useState, neither with a rollback path on failure — post-status.tsx:34-37 discards the action's result entirely.

Performance
next/image vs raw <img>: zero raw <img> in src/app or src/components. Both image sites use next/image with fill + sizes (asset-list.tsx:61-67, asset-picker.tsx:52-58). As instructed, src/templates/ was not scanned for this (Satori requires raw <img> there).

Font loading — two independent strategies, both active:

UI chrome: next/font/google for Geist + Geist Mono (layout.tsx:2,5-13), subsets: ["latin"], self-hosted and preloaded by Next with font-display: swap by default. No FOIT risk.
Brand Kit preview: 10 raw @font-face rules in globals.css:7-84, all font-display: swap (FOUT, not FOIT), all pointing at unsubsetted, uncompressed .ttf in public/fonts/:
File Bytes
inter-400.ttf 324,820
inter-700.ttf 326,468
ibm-plex-sans-400.ttf 205,252
ibm-plex-sans-700.ttf 205,220
playfair-display-400.ttf 123,240
playfair-display-700.ttf 123,536
jetbrains-mono-400.ttf 112,172
jetbrains-mono-700.ttf 112,092
space-grotesk-400.ttf 69,360
space-grotesk-700.ttf 69,308
10 files, total 1,671,468 bytes ≈ 1.63 MB
These are declared globally in globals.css (loaded on every route including / and /sign-in). Browsers lazy-fetch @font-face only on first glyph use, so in practice a preview pulls the 2 faces its Brand Kit selects — but the ceiling for a user who switches fonts around the Brand Kit page is the full 1.63 MB of TTF, with no .woff2 variants, no unicode-range subsetting, and no <link rel="preload"> (so the fetch starts only after CSS parse + layout). For scale: the 2-face Inter pair alone is 651 KB, versus a typical woff2 Latin subset of ~15–25 KB per face.

Client/server split — 18 files carry "use client"; 9 are app-level, 9 are ui/ primitives:

Client file LOC Note
post-editor.tsx 393 largest client component in the app
slide-fields.tsx 317 pure render switch, no hooks, no event system of its own
brand-kit-form.tsx 296
create-post-form.tsx 172
slide-design.tsx 105 pure render, no hooks
asset-list.tsx 123
sign-in-form.tsx 111
asset-uploader.tsx 95
asset-picker.tsx 69
post-status.tsx 52
app-nav.tsx 41 client solely for usePathname() (:4,16)
sign-out-button.tsx 25
ui/: dropdown-menu 227, select 174, dialog 144, tabs 80, sonner 40, label 20 sonner.tsx is never mounted yet still marks a client boundary if ever imported
slide-fields.tsx (317 LOC) and slide-design.tsx (105 LOC) declare "use client" but contain no hooks and no browser API — they are prop-driven render functions. They are children of post-editor.tsx, which is genuinely client, so the directive is redundant rather than harmful; the 422 combined LOC ship to the browser either way. Server components remain: all 7 page.tsx, both layout.tsx, slide-preview.tsx, post-card.tsx, empty-state.tsx, brand-preview.tsx, and ui/{button,card,input,textarea,skeleton}.tsx.

Slide preview mechanism — it is NOT an <img> hitting the PNG route. src/components/slide-preview.tsx is an async server component (no "use client", await at :26). It calls slideElement(...) (src/server/render/slide.tsx:24-52) — the exact same element slidePng feeds to Satori at :64-68 — and renders it as live DOM, wrapped in overflow-hidden (:32) and scaled with transform: scale(width / size.width) + transformOrigin: "top left" (:36-41). The PNG route /api/posts/[postId]/slides/[slideId]/png is used only by the explicit Download link (post-editor.tsx:241) and /api/posts/[postId]/export by Download all ([postId]/page.tsx:80). So: zero network round-trips per keystroke, and no image decode.

The cost sits elsewhere. [postId]/page.tsx:34-46 renders every slide in the post, not just the visible one, inside Promise.all(inputs.map(...)); post-editor.tsx:188-192 then holds all of them in the DOM simultaneously, hiding the inactive ones with the hidden attribute. Each slideElement call re-runs slideTheme and, for template === "code", await highlightCode(...) (slide.tsx:34-37) — a Shiki highlight per code slide.

Re-render/refetch storm — the measured path. There is debouncing but no caching:

Autosave debounce = 900ms (post-editor.tsx:50 autosaveDelay, timer at :99, cleanup :115). Gated by shouldAutosave (editor-state.ts:43-47), which compares JSON.stringify signatures, so no-op renders don't fire. This is the one guard present.
Every autosave ends with router.refresh() (post-editor.tsx:112). Every run() — 8 more call sites: template change, duplicate, delete, move ×2, regenerate, generate/remove illustration — also ends with router.refresh() (:132). post-status.tsx:36 adds one more.
Each router.refresh() re-executes [postId]/page.tsx server-side: requireUserId() + loadRenderablePost + listAssets (:22-27), then re-renders all N slide previews from scratch (:34-46), re-highlighting every code slide. There is no cache(), no unstable_cache, no memo on slideElement, and the previews are passed down as a previews: React.ReactNode[] prop (post-editor.tsx:62), so every refresh replaces the entire array — including the N−1 previews that are hidden and unchanged.
Net: for a post of N slides, one 900ms-debounced pause of typing = 1 DB round-trip + N full slide renders, of which N−1 are discarded behind hidden. Continuous typing produces one such cycle per 900ms gap.
Unthrottled inputs that feed the same cycle: slide-design.tsx:71 type="range" fontScale (fires on every drag tick) and :42 type="color" (fires continuously while the OS picker is dragged) — both write straight into editing, restarting the 900ms timer on each event, so a drag defers the save but each pause still triggers the full N-slide re-render.
Consistency
Spacing — 11 distinct gap-* values: gap-2 (44), gap-4 (15), gap-1.5 (12), gap-3 (8), gap-6 (4), gap-10 (2), gap-1 (2), gap-8 (1), gap-5 (1), gap-x-6 (1), gap-y-2 (1). The three singletons are gap-8 (brand-kit-form.tsx:94), gap-5 (post-editor.tsx:156), gap-x-6/gap-y-2 ((app)/layout.tsx:14).

Padding — 22 distinct values: px-6 (13), py-1.5 (8), py-10 (7), px-3 (6), py-1 (5), px-2 (5), pl-8 (5), p-4 (5), p-1 (5), py-2 (3), p-3 (3), px-4 (2), px-2.5 (2), pr-2 (2), then eight one-offs: py-8 (asset-picker.tsx:36), py-6, py-3 ((app)/layout.tsx:14), pt-6, pr-8, pl-2, pb-6, p-8 (brand-preview.tsx:10), p-6, p-2 (asset-picker.tsx:60).

Margin — 11 distinct values: mt-3 (5), mt-2 (5), mt-10 (5), my-1 (3), mt-8 (3), mt-4 (3), mt-1 (3), mx-1 (2), mt-6 (1), mb-3 (1, brand-kit-form.tsx:291).

Every one of these is an on-scale Tailwind step (no arbitrary p-[13px]-style values in src/app/src/components — the only arbitrary sizings are max-h-[60vh], min-w-[8rem], h-[calc(100%-1px)], bottom-[-5px], ring-[3px]). So the inconsistency is breadth, not off-token values: 44 distinct spacing utilities in ~3,200 LOC.

Border radii — 7 distinct: rounded-md (17), rounded-lg (10), rounded-sm (5), rounded-xl (2), rounded-full (2), rounded-xs (1, ui/dialog.tsx:65), rounded-none (1, ui/tabs.tsx:25). All resolve through --radius: 0.625rem at globals.css:111 via the @theme inline ladder at :103-106. rounded-xl appears twice — slide-preview.tsx:32 and one ui/ site — making the slide preview the only xl-cornered surface in the app while every sibling container uses rounded-lg (post-card.tsx:17, empty-state.tsx:15, asset-list.tsx:59, post-editor.tsx:342,349).

Shadows — 5 distinct: shadow-xs (7, all inside ui/ primitives), shadow-sm (2), shadow-md (2), shadow-lg (2), shadow-none (1). Zero shadow utilities appear in any app-level file — all 14 are inside src/components/ui/.

Type scale — 7 distinct: text-sm (38), text-xs (22), text-2xl (5), text-lg (2), text-base (2), text-4xl (1, page.tsx:8), text-3xl (1, brand-preview.tsx:25). The gap from text-2xl (page titles) to text-sm/text-xs (everything else) is the whole hierarchy — text-base never appears outside the ui/ input defaults.

Button variants — 3 explicit, in use: variant="outline" (11), variant="ghost" (8), variant="destructive" (1, and that one is inside ui/dropdown-menu.tsx, not an app button — asset-list.tsx:82 passes variant="destructive" to DropdownMenuItem, a different component). Plus the implicit default. Defined but unused at call sites: secondary, link (ui/button.tsx:15,17). Button sizes — 2 in use: size="sm" (19), size="icon" (2); size="lg" (ui/button.tsx:22) is never used. Note post-editor.tsx:232-239 uses variant="outline" for the slide Delete button while asset-list.tsx:82 uses variant="destructive" for asset Delete — the same destructive intent rendered two ways.

Copy — capitalization drift (Title Case vs sentence case, on comparable elements):

Title Case Sentence case
dashboard/page.tsx:49 "Your Content" posts/new/page.tsx:6 "Create a post"
assets/page.tsx:13 "My Assets" post-editor.tsx:350 "Regenerate this slide"
brand/page.tsx:12 "Brand Kit" post-editor.tsx:343 "This slide's design"
dashboard/page.tsx:70 "Recent Posts" asset-picker.tsx:33 "Choose an asset"
dashboard/page.tsx:59 "Drafts" asset-list.tsx:101 "Rename asset"
app-nav.tsx:10 "Create Post" sign-in-form.tsx:16 "Welcome back"
brand-kit-form.tsx:279 "Save Brand Kit" sign-in-form.tsx:17 "Create your account"
dashboard/page.tsx:101 "Set up your Brand Kit" (mixed) post-editor.tsx:302 "Generate illustration"
The same feature is titled three ways: nav item "Create Post" (app-nav.tsx:10), dashboard CTA "Create Post" (dashboard/page.tsx:53), page h1 "Create a post" (posts/new/page.tsx:6) — and the submit button on that page reads "Generate" (create-post-form.tsx:162). "Brand Kit" is an h1 on /brand and an h2 on /dashboard:95.

Copy — synonym drift on destructive/removal verbs:

Delete: post-editor.tsx:238 (slide), asset-list.tsx:83 (asset).
Remove: slide-fields.tsx:142 "Remove item", post-editor.tsx:313 "Remove illustration", post-editor.tsx:336 "Remove image". Both verbs describe permanent deletion; nothing distinguishes them.
Copy — add/choose drift: slide-fields.tsx:156 "Add item" vs post-editor.tsx:326 "Choose image"/"Change image" vs brand-kit-form.tsx:65 bare "Choose" vs asset-uploader.tsx:85 "Upload". Generate/Regenerate: create-post-form.tsx:162 "Generate", post-editor.tsx:383 "Regenerate", post-editor.tsx:302 "Generate illustration", and the 7 regenerate sub-actions at post-editor.tsx:41-48 mix verb-first ("Rewrite", "Change layout") with adjective-phrase ("Make shorter", "Make clearer", "Make funnier", "More technical", "Another design").

Copy — locale drift (en-GB mixed into an otherwise en-US codebase):

slide-design.tsx:86 renders the button label "Centre"; the value it sets is "center" (:78).
slide-design.tsx:39 aria-label={${label} colour} — British, vs brand-kit-form.tsx:167 aria-label={label + " color picker"} — American, for the identical control.
create-post-form.tsx:105 placeholder "what to emphasise".
Everywhere else uses American spelling ("colors" throughout types/brand.ts, dashboard/page.tsx:100 "Fonts, colors and voice").
The two color-picker aria-labels also drift in shape: "Background colour" vs "Background color picker".
Ellipsis style: pending labels use three ASCII periods consistently — "Saving..." (asset-list.tsx:115, brand-kit-form.tsx:279), "Uploading...", "Generating...", "Regenerating...", "Working..." (post-editor.tsx:302), "Signing out..." — except post-editor.tsx:252, where the aria-live status renders bare "Working" and "Saving"/"Saved" (:100,111) with no ellipsis.

result: Assessment B complete — detector found 4 findings (all overused-font in globals.css, all false positives: they are Brand Kit PNG-render faces, while the real UI font Geist goes undetected in layout.tsx); no browser driver installed so all live-screenshot steps were skipped and nothing was fabricated; computed WCAG ratios show border/input at 1.26:1 and light-mode ring at 2.59:1 failing the 3:1 UI bar, muted-foreground passing body text by only 0.23, and the entire dark palette unreachable because .dark is never applied; plus zero error/loading/not-found files, an unmounted Toaster and unused Skeleton, no confirmation on three destructive paths, no prefers-reduced-motion, a 416px-wide non-wrapping editor row against 342px available at 390px, 1.63 MB of unsubsetted TTFs, and a router.refresh() after every mutation that re-renders all N slide previews per 900ms autosave.

Both assessments are in. Let me verify the most consequential claims myself before I put them in a report.

Bash Verify key claims from both assessments
IN
cd "C:\Users\USER\Desktop\projects\personal\compose" && echo "=== app/page.tsx ===" && cat -n src/app/page.tsx && echo "=== brand.ts 70-90 ===" && sed -n '70,90p' src/types/brand.ts && echo "=== brand-preview head ===" && sed -n '1,12p' src/app/\(app\)/brand/brand-preview.tsx && echo "=== editor-state 35-50 ===" && sed -n '35,50p' src/app/\(app\)/posts/\[postId\]/editor-state.ts && echo "=== png route 15-25 ===" && sed -n '15,25p' src/app/api/posts/\[postId\]/slides/\[slideId\]/png/route.ts

OUT
=== app/page.tsx ===
1 import Link from "next/link";
2
3 import { Button } from "@/components/ui/button";
4
5 export default function Home() {
6 return (
7 <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-6">
8 <h1 className="text-4xl font-semibold tracking-tight">Compose</h1>
9 <p className="text-muted-foreground text-lg">
10 Your personal AI content designer. Boilerplate is ready; see tasks.md to start building.
11 </p>
12 <div>
13 <Button asChild>
14 <Link href="/dashboard">Go to dashboard</Link>
15 </Button>
16 </div>
17 </main>
18 );
19 }
=== brand.ts 70-90 ===
/** Seeded for every new user, and the fallback the renderer uses until one is saved. */
export const defaultBrandKit: BrandKit = {
name: "Your brand",
username: "@yourhandle",
logoUrl: null,
avatarUrl: null,
fonts: { primary: "Inter", secondary: "Inter" },
colors: { background: "#0B0B0F", text: "#F5F5F7", accent: "#6E56CF", muted: "#8A8A96" },
style: { radius: 16, card: "flat", illustration: "line", codeBlock: "dark" },
voice: null,
};

/** True while the seeded placeholder is untouched, so the UI can prompt for setup. */
export function isDefaultBrandKit(kit: BrandKit) {
return kit.name === defaultBrandKit.name && kit.username === defaultBrandKit.username;
}
=== brand-preview head ===
import type { BrandKit } from "@/types/brand";

/**

- Stand-in for the real renderer (Phase 6) so colors, fonts and radius can be
- judged while editing. Same sample slide, same 4:5 carousel ratio.
  */
  export function BrandPreview({ kit }: { kit: BrandKit }) {
  return (
   <div
     className="flex aspect-[4/5] w-full max-w-sm flex-col justify-between overflow-hidden border p-8"
     style={{
       backgroundColor: kit.colors.background,

=== editor-state 35-50 ===
return { id: slide.id, content: slide.content, design: slide.designConfig ?? {} };
}

/**

- Selecting another slide re-renders before the draft catches up, so the draft
- can briefly belong to the slide you just left. Saving then would write the old
- slide's content onto the new one.
  */
  export function shouldAutosave(draft: SlideDraft, slide: EditableSlide) {
  if (draft.id !== slide.id) return false;

return draftSignature(draft) !== serverSignature(slide);
}
=== png route 15-25 ===
if (!found) return new Response("Not found", { status: 404 });

const index = found.slides.findIndex((row) => row.id === slideId);
if (index < 0) return new Response("Not found", { status: 404 });

await markExported(userId, postId);

return slidePng(
found.inputs[index],
found.brand,
parseFormat(new URL(request.url).searchParams.get("format")),
Both agents' load-bearing claims check out verbatim. Here is the synthesis.

Method: dual-agent (A: design review · B: detector + technical evidence), run as two isolated parallel subagents. No browser automation is exposed in this session and no browser driver is installed in the repo, so no screenshots were taken and no visual overlay exists in your browser — every layout and contrast number below is computed from source, not observed. Everything else ran in full.

Design Health Score

# Heuristic Score Key issue

1 Visibility of System Status 2/4 Export is a bare <a download> with zero client state while the server renders N PNGs. Three-stage AI pipeline reports no stage. Zero loading.tsx/Suspense anywhere.
2 Match System / Real World 3/4 Raw enum printed lowercase ("things i learned"), format toggle reads "4:5"/"1:1", database_icon promoted to user-facing placeholder.
3 User Control and Freedom 1/4 No undo anywhere. Three destructive paths fire on first click. In-flight keystrokes dropped on slide switch. Generation can't be cancelled.
4 Consistency and Standards 2/4 44 distinct spacing utilities, 7 radii, Delete rendered as outline in one place and destructive in another, Title Case vs sentence case on comparable headings, en-GB leaking into an en-US codebase.
5 Error Prevention 2/4 Good counters and disabled submit; but zero aria-invalid/aria-describedby at any call site, no confirmations, no beforeunload, hex schema accepts an unreadable color pair.
6 Recognition Rather Than Recall 2/4 Nine layouts chosen by name from a text dropdown. No post thumbnails. The icon vocabulary is hidden and the fallback for guessing wrong is a paid API call.
7 Flexibility and Efficiency 2/4 No keyboard slide navigation, no shortcuts, reorder is one round-trip per position, format switch resets to slide 1.
8 Aesthetic and Minimalist Design 2/4 Zero-chroma default shadcn palette, one page template used four times, ~20 flat controls in the editor column.
9 Error Recovery 3/4 Messages are plain and name the fix. But Zod paths leak, no field-level association, and no error.tsx at any level.
10 Help and Documentation 1/4 None. No onboarding, no example content, no template gallery, no tooltips, no cost disclosure, no password reset.
Total 20/40 Acceptable (bottom edge)
I moved Consistency down from the design agent's 3 to a 2 on the evidence agent's measurements — the drift is broader than a reading of the source suggests. Everything else is where the design review landed it.

Cognitive load: HIGH — 6 of 8 checks fail. Single focus, chunking, hierarchy, one-thing-at-a-time, ≤4 options, and working memory all fail. Eight decision points exceed four visible options: template (9), post type (9), regenerate action (7), tone (6), asset type (6), illustration style (5), two font pickers (5 each), plus an unbounded slide strip.

Design Specificity Verdict
There are two products in this repo, built to completely different standards, and the one you actually touch is the weaker one.

LLM assessment. The slide renderer is genuinely authored. primitives.tsx:14-93 pins a 44px avatar bottom-left and reserves 44 + 48 of footer height in theme.ts:16 so copy can never kiss it. theme.ts:42-47 derives card surfaces as alpha-over-text rather than fixed grays, so "Outlined" stays correct whether the brand is white-on-black or black-on-cream. The type scale at theme.ts:66-75 steps display 76→68 between 4:5 and 1:1 — someone thought about optical size per format. And the fitting doctrine (measure real glyph advances, shrink the type, never reject the user's copy) is the product thesis expressed as engineering.

The app around it is interchangeable shadcn CRUD. Four surfaces share one skeleton (mx-auto max-w-5xl px-6 py-10, text-2xl h1, text-sm muted subtitle). The palette at globals.css:114-134 is untouched generated neutral — chroma zero on every token except --destructive. Compose has no color of its own. lucide-react is a dependency and the app UI contains not one icon; slide navigation uses the HTML entities &larr; and &rarr; as button labels. And post-card.tsx:15-23 — a product whose entire promise is "your posts look good" — shows zero pixels of your posts on the dashboard. Spec §21 literally draws [Post] [Post] [Post]; this renders text rows.

The output is designed. The instrument is not. You spend 100% of your time in the instrument.

Deterministic scan. detect.mjs exited 2 with 4 findings, all one rule: overused-font at globals.css:8,16,24,32. All four are false positives — those are the ten @font-face declarations for the Brand Kit faces Satori renders into PNGs, not app chrome. The detector's importedBy: ["layout.tsx"] inference is mechanically right and semantically wrong. Worth noting it inverted: your actual UI typeface is Geist, loaded via next/font/google in layout.tsx:5-13, and Geist is on the detector's overused list — it just isn't in a file the scan attributes.

The detector found nothing in any .tsx file. The real technical findings came from measurement, not the rule set:

Finding Measured Status
border/input vs background 1.26:1 (needs 3:1) FAIL — the boundary of every Input, Textarea, SelectTrigger and bordered container in the app
Light-mode ring vs background 2.59:1 (needs 3:1) FAIL — and the shadcn primitives use ring-ring/50, which composites lower still
muted-foreground vs background 4.73:1 Passes by 0.23, carrying real information at 12px in 14 places
muted-foreground vs muted 4.34:1 FAIL, but latent — no text currently sits on bg-muted
Dark palette fully tokenized, unreachable .dark is never applied; no ThemeProvider, no toggle, no prefers-color-scheme
Editor slide row at 390px needs 416px, has 342px 74px deficit; both arrows are shrink-0
Touch targets largest is 36px Nothing in the app reaches 44px; slide chips are ~28×24px
prefers-reduced-motion zero occurrences in src/ Dialog/select/dropdown animations run unconditionally
Brand Kit fonts 1.63 MB of unsubsetted TTF No woff2, no unicode-range, no preload
Where the two assessments disagreed with each other, the evidence agent won and the news is good: form labelling is near-perfect (every field has a <Label htmlFor> or aria-label; exactly one control, the regenerate select at post-editor.tsx:356, is unlabelled), there are zero raw <img> and zero div-click-handlers in the app, and 12 of 14 server actions have proper pending state. The accessibility pass in tasks.md was real work. It just stopped at labels and never reached contrast, focus rings, touch targets, motion, or error association.

Visual overlays: none. No browser driver is installed and the brief forbade installing one, so the live server, screenshots and script injection were all skipped. Nothing was fabricated.

Overall Impression
This is a well-engineered product with an under-designed front end, and the gap is unusually wide. The architecture makes preview/export drift impossible rather than merely unlikely — slide-preview.tsx is an async server component that renders the exact element Satori serializes, as live DOM. That's a better decision than most tools in this category make, and it's why the one genuine emotional peak in the product lands honestly.

Then the product takes that renderer and refuses to use it anywhere a user is making a decision. No thumbnails on the dashboard. Nine layouts as a text dropdown. A Brand Kit preview that's still a Phase-6 stub. A 320px preview that renders your body copy at 9.5 CSS pixels.

The single biggest opportunity: you already have a renderer that produces beautiful images of anything. Put it in front of every decision the user makes. Thumbnails, template picker, filmstrip, brand preview, export confirmation. That one move fixes recognition-over-recall, the specificity problem, and the peak-end inversion simultaneously, and it costs almost no new infrastructure.

What's Working

1. The preview/export identity contract is architecturally enforced. slide-preview.tsx:11-46 awaits slideElement(...), the same element slidePng feeds to Satori, and scales it with a CSS transform. globals.css:7-84 loads the same TTFs the renderer hands over as bytes. There's no per-keystroke network round-trip and no image decode — the preview is live DOM. Most tools ship an HTML preview and a separate image pipeline and spend their lives reconciling them.

2. The fitting policy treats your writing as the constant and the design as the variable. slide.ts:25-56 separates targets the prompts quote from ceilings the schema enforces, and the renderer shrinks type rather than clipping. The comment at slide.ts:50 — "Models cannot count characters, and that failed three generations before it measured" — shows this was learned, not guessed. That's the "you shouldn't need design skills" principle correctly located in the renderer instead of in an error message aimed at the user.

3. The save-correctness model and the navigate/reorder split are unusually careful. editor-state.ts:22-47 compares by value signature so a fresh {} can't loop the autosave, and the draft carries its own slide id so a save can never land on the wrong slide — with a comment explaining exactly why, and a unit test. Paired with post-editor.tsx:137-144, where move() reorders and follows the slide while the arrows only change what you look at, each with an aria-label saying which it is. That distinction defeats most editors.

Also worth calling out: the UX copy is the strongest part of the app UI. "That is 42 characters over. Trim it down to 6000." "That slide is gone. Reload the page." Plain, specific, no hedging.

Priority Issues
[P0] The landing page ships build instructions to production
What. page.tsx:10 renders "Your personal AI content designer. Boilerplate is ready; see tasks.md to start building." No redirect, no auth check. Verified verbatim.

Why it matters. It's the first surface at / for every visitor and every signed-in user who types the bare domain. It tells them the product is unfinished and points them at a repo file.

Fix. Today: if (await currentUserId()) redirect("/dashboard"); else redirect("/sign-in");. Then, separately, build the real thing — spec §2's before/after pipeline as two columns, three real generated carousels shown as actual slides (the renderer already produces them), one CTA.
Suggested command: /impeccable shape for the real landing page; the redirect is a two-line fix you don't need a command for.

[P0] The editor destroys user work in three ways, with no undo anywhere
What.

editor-state.ts:43 plus the cleanup at post-editor.tsx:115 — keystrokes inside the 900ms debounce are dropped when you switch slides or leave. No warning, no beforeunload. This one is a correct guard with an incomplete consequence: the comment explains it exists so a save can't write the old slide's content onto the new one. The guard is right; what's missing is the flush.
post-editor.tsx:232-239 — Delete fires on first click. alert-dialog is not installed; confirm( appears zero times in the codebase.
post-editor.tsx:374-384 — Regenerate reads slide content from the database, discarding any in-flight edit, then overwrites irreversibly.
Why it matters. This is a tool for people refining copy. Losing a sentence is the worst thing it can do, and it currently does so silently in the most common interaction in the app: type, then click another slide.

Fix. Hoist the debounced payload into a ref and flush it synchronously at the top of setActive and run(). Add a beforeunload guard while the draft signature differs from the server's. Install alert-dialog and gate Delete behind it, naming the slide. Mount the Toaster you already have — sonner is a dependency, ui/sonner.tsx exists fully configured, and <Toaster /> is mounted nowhere and toast() is called nowhere — and give delete and regenerate an Undo action. Regenerate's undo is nearly free: actions.ts:144 already holds target.content in hand.
Suggested command: /impeccable harden

[P0] The first real export is branded with a placeholder handle
What. brand.ts:73 seeds username: "@yourhandle". primitives.tsx:71-83 draws it in the footer of every slide. Nothing in /posts/new, the editor, or either export route checks. And isDefaultBrandKit at brand.ts:83-85 compares only name and username — so someone who configures colors, fonts, radius and voice but leaves the name alone is still told their Brand Kit isn't set up. Verified verbatim.

Why it matters. It fails spec §5's core principle at the exact moment the principle is first tested, and it produces PNGs you can't publish. The failure is invisible until the artifact exists — the most expensive place to find it.

Fix. Deep-compare the whole kit in isDefaultBrandKit. Warn (don't block) on /posts/new when the kit is still seeded. Block the export routes on a default username, or substitute the account name — shipping a placeholder into a downloaded file is worse than a refused download. Route new users to /brand once after sign-up; Better Auth already seeds the kit there.
Suggested command: /impeccable onboard

[P1] The Brand Kit — your stated differentiator — previews a slide the renderer never produces
What. brand-preview.tsx:3-6 still reads "Stand-in for the real renderer (Phase 6)." Phase 6 shipped; tasks.md:52 is checked off. The stub is hand-written Tailwind, so card style, illustration style, code block style, logo, and the secondary font's footer role produce no feedback at all — 6 of 11 controls adjusted blind. Verified verbatim.

Why it matters. Spec §5 and §33 make visual identity the entire differentiator. The one screen where you author that identity lies to you about what it will look like. There's a second, invisible consequence: slideTheme() resolves from loadBrandKit() at render time, so editing the kit retroactively restyles every existing post, including ones already marked Exported, and nothing says so.

Fix. Replace BrandPreview with SlidePreview driven by the fixtures already in fixtures.ts. Show three at once (Cover, Code, Numbered list) so card style, code block style and illustration style are all visible — pass them down as ReactNode[] exactly as posts/[postId]/page.tsx:34-46 already does. Add four starter palettes ("Minimal dark", "Editorial light", "Terminal", "Warm") that set colors, fonts, radius and card style in one click — spec §4 says this user is bad at graphic design, and four raw hex pickers is the wrong tool for that person. Contrast-check background against text and warn below 4.5:1. Disclose the blast radius on save.
Suggested command: /impeccable shape

[P1] A visual product hides visuals at every decision point, and never says "done"
What. No thumbnails on the dashboard (post-card.tsx). Nine layouts as a text dropdown (post-editor.tsx:264-280). The carousel's sequence represented as a row of digits (post-editor.tsx:157-175). A preview hard-coded to 320px at page.tsx:13 with no zoom — theme.type.body = 32 renders at 9.5px, code captions at 7.7px. Export as a bare <a download> with no pending state and no success state, while the server renders N PNGs sequentially.

Why it matters. Every one of these is a moment where you must judge appearance, and appearance is withheld. Together they're why the app reads as generic CRUD despite a strong renderer one import away. The export gap specifically inverts peak-end — the product peaks in the middle and ends on a browser download shelf. Spec §34's secondary metric is the share of generated posts actually published, and nothing at the finish line moves it.

Fix. Cache the first slide's PNG per post and use it as the PostCard thumbnail at 4:5. Replace the template dropdown with a 3×3 grid of miniature fixture renders. Replace the number strip with a filmstrip of previews that are already rendered and sitting in the DOM — post-editor.tsx:188-192 renders all N and hides all but one with the hidden attribute, so a 64px strip costs nothing extra. Make the preview min(520px, available) with click-to-enlarge (dialog is installed). Convert export to a client component with a pending state and a completion panel: thumbnails, count, dimensions, filename, and your own final-slide CTA text ready to copy.
Suggested command: /impeccable layout, then /impeccable delight for the completion moment

Persona Red Flags
Alex (impatient power user). Lands on /, reads "see tasks.md," concludes the product is unfinished. 20+ seconds on Generate with no progress, no cancel, and no way to open a tab without killing the request — he clicks it twice. No keyboard shortcuts; arrow keys are inert, so moving between six slides is six mouse trips to a row of digits. Moving slide 6 to position 2 is four clicks and four router.refresh() calls. Checking the square crop navigates the page and dumps him back on slide 1. Clicks "Download all," sees nothing for several seconds, clicks again, triggers a second full Satori render of every slide.

Jordan (confused first-timer). First screen is two stacked dashed boxes with two competing CTAs and nothing indicating the Brand Kit should come first. Takes the more prominent path, generates, and every slide is footed @yourhandle over a purple-and-black palette that isn't hers — her verdict on "does this look like my account" forms here, and it's no. Sees a Template dropdown listing "Cover, Text, Numbered list, Code, Comparison…" with no idea what any look like, and changing it is blind, immediate and irreversible. Hits "Visual hint," placeholder database_icon, help text saying no icon matches and to "try another word," with no list of words — and the only visible escape is "Generate illustration," styled identically to "Duplicate," which never says it calls a paid image model. Never opens the unstyled <details> at post-editor.tsx:342 and never learns she can change colors. And if she forgets her password, there is no reset path anywhere.

Riley (stress tester). Types in slide 1, clicks slide 2 within 900ms, comes back: text gone, no warning, indicator never fired — reproducible silent data loss. Deletes a slide in one click, no confirm, no undo. Types a careful rewrite, hits Regenerate before the debounce: two losses in one click. Downloads a single slide to inspect it and the whole post silently flips to "Exported" (png/route.ts:20, verified) — it drops out of Drafts and reappears under Recent Posts because he looked at an image. Sets the brand background to match the text color; hexColorSchema accepts it and every post renders invisible. With a screen reader, the sign-in tabs advertise aria-controls pointing at panels that don't exist (sign-in-form.tsx:57-107 imports no TabsContent).

Sam, the developer building a public presence (your spec §4/§35 persona). Ships at 11pm, has one good paragraph, wants a carousel that looks like the rest of his grid. Grid consistency is a visual judgment and his dashboard is a list of text rows — the product's core promise, "every post should feel like it came from the same account," is unverifiable inside the product. The one place he'd tune that consistency shows a hand-written fake. He configures everything, leaves the name as "Your brand," and the dashboard keeps insisting his kit isn't set up. His content is an ordered narrative and the only view of that narrative is the numerals 1 through 6 — he can't check that the hook leads and the CTA lands. His code slide renders too small to read, so he must export to check it, which marks the post Exported. Five minutes later he has a zip and silence.

Minor Observations
Dead and missing dependencies. skeleton.tsx and sonner.tsx are installed and never imported. next-themes is imported only by the unmounted Toaster. lucide-react has zero icons in the app UI. tooltip and alert-dialog are not installed and both are needed.

Zero route-level special files. No error.tsx, loading.tsx, not-found.tsx or global-error.tsx anywhere in src/app. Every route is a fully-awaited async server component with no streaming boundary — posts/[postId]/page.tsx:34-46 awaits a Promise.all over every slide render before any markup appears, and notFound() at line 29 falls through to the stock Next.js page.

The refresh storm. Every autosave and all 8 run() call sites end in router.refresh(), which re-executes the page and re-renders all N slide previews from scratch, re-running Shiki on every code slide — of which N−1 are immediately hidden. One 900ms typing pause = 1 DB round-trip + N full renders. The fontScale range input and the color inputs in slide-design.tsx feed the same cycle unthrottled.

Accessibility gaps past the labels. Zero aria-invalid/aria-describedby at any call site — the over-limit counters turn text-destructive and the input is never marked invalid (color-only meaning, in 2 places). /sign-in has no h1 (CardTitle renders a div). Brand Kit's "Saved." is a plain <span> with no live region while its error branch two lines down has role="alert". No skip link. Nothing reaches a 44px touch target.

Smaller items, roughly in order of cheapness:

posts/[postId]/page.tsx:53 prints the raw enum lowercase while postTypeLabels already exists in create-post-form.tsx. Move it to src/types/post.ts and use it in both.
Format toggle should read "Carousel"/"Square" with the ratios secondary.
app-nav.tsx:21 exact-matches pathname, so /posts/[id] highlights nothing — the editor has no "you are here" and no breadcrumb home.
&larr;/&rarr; as button content → ChevronLeft/ChevronRight.
Delete sits between Duplicate and Download in one undifferentiated five-button row, and slide Delete is variant="outline" while asset Delete is variant="destructive".
The h1 at posts/[postId]/page.tsx:55 has no truncate/line-clamp/break-words, and there are zero break-* utilities in the codebase.
app-nav has no mobile treatment at all — four links plus wordmark plus sign-out exceed 342px and wrap to 2–3 rows.
Add paste-from-clipboard to the asset uploader. asset-uploader.tsx:53-60 is a raw file input. Screenshots are this user's dominant asset and they arrive on the clipboard. Highest-value missing interaction on that page.
Generated illustrations never enter the Asset library, so a good result can't be reused (spec §16 wants them there).
Zod issue paths leak into user-facing strings ("items 0 title must not be empty").
deleteAssetAction and changeTemplateAction are the two mutations with no pending gating.
en-GB leaking in: "Centre" (setting the value "center"), aria-label="Background colour" next to "Background color picker" for the identical control, "emphasise".
Give the first-post empty state a real sample carousel and a "Try this example" button that prefills the form with spec §7's debugging paragraph.
dashboard/page.tsx:50 buries your own success metric in 12px muted text under the page title. Commit to it or drop it.
slide-fields.tsx and slide-design.tsx declare "use client" with no hooks and no browser API — harmless (they're children of a client component) but misleading.
Deferred scope I'm recommending anyway, since you asked for it: save a design as a reusable template (spec §15, Backlog) is the mechanism by which "consistently good" becomes true over time, and it's cheap now that designConfig and PostSpec exist. Caption generation (spec §20, Backlog) is worth the most at the export moment specifically — the completion panel is exactly where it belongs, and its absence is a direct drag on spec §34's secondary metric. Streaming the generation isn't in tasks.md at all; planDesign returns slides in order, so streaming the first preview as soon as it validates turns a 20-second dead wait into a ~6-second first paint.

Questions to Consider
Why is the carousel the one thing the carousel editor never shows? Every decision you make is about sequence, and sequence is represented by the numerals 1 through 6.
If the Brand Kit is the differentiator, why did Content Intelligence get a three-stage pipeline with versioned prompts while Visual Identity got a settings page with a fake preview?
The renderer measures glyph advances to guarantee the type fits — why does the preview then shrink it to 9.5px, the one size at which you can't evaluate it?
What is Compose's own visual identity? A tool that sells taste ships zero chroma, one type size per role, and no icon anywhere. The renderer proves you can design. Why does the app refuse to?
What in this interface moves spec §34's secondary metric? The flow ends at a download shelf; every remaining step to a published post happens outside the product, unassisted.
Why ask the user to type database_icon at all? The AI already produced the hint, resolveIcon has a fixed vocabulary, and the fallback is a paid generation. Show the icons and let them click one.
Does the editor believe in autosave? It debounces, flashes "Saved" in 12px gray, clears the word, offers no undo, and drops keystrokes on slide switch.
Why does inspecting one slide mark the whole post exported? A read with a state-mutating side effect that rearranges your dashboard is a decision, not an oversight — what was it optimizing for?
Let me persist this so /impeccable polish can inherit the priorities.

Bash Persist critique snapshot and read trend
IN
cd "C:\Users\USER\Desktop\projects\personal\compose" && cat > "$TEMP/compose-critique.md" <<'CRITIQUE_EOF'
Method: dual-agent (A: design review, B: detector + technical evidence), two isolated parallel subagents. No browser automation available; no screenshots, no overlay. All layout and contrast numbers computed from source.

## Design Health Score

| #         | Heuristic                       | Score     | Key Issue                                                                                                                                                                      |
| --------- | ------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1         | Visibility of System Status     | 2         | Export is a bare `<a download>` with zero client state while the server renders N PNGs. Three-stage AI pipeline reports no stage. Zero loading.tsx/Suspense anywhere.          |
| 2         | Match System / Real World       | 3         | Raw enum printed lowercase, format toggle reads "4:5"/"1:1", `database_icon` promoted to user-facing placeholder.                                                              |
| 3         | User Control and Freedom        | 1         | No undo anywhere. Three destructive paths fire on first click. In-flight keystrokes dropped on slide switch. Generation cannot be cancelled.                                   |
| 4         | Consistency and Standards       | 2         | 44 distinct spacing utilities, 7 radii, Delete rendered as outline in one place and destructive in another, Title Case vs sentence case, en-GB leaking into an en-US codebase. |
| 5         | Error Prevention                | 2         | Good counters and disabled submit; zero aria-invalid/aria-describedby at any call site, no confirmations, no beforeunload, hex schema accepts an unreadable color pair.        |
| 6         | Recognition Rather Than Recall  | 2         | Nine layouts chosen by name from a text dropdown. No post thumbnails. Icon vocabulary hidden; fallback for guessing wrong is a paid API call.                                  |
| 7         | Flexibility and Efficiency      | 2         | No keyboard slide navigation, no shortcuts, reorder is one round-trip per position, format switch resets to slide 1.                                                           |
| 8         | Aesthetic and Minimalist Design | 2         | Zero-chroma default shadcn palette, one page template used four times, ~20 flat controls in the editor column.                                                                 |
| 9         | Error Recovery                  | 3         | Messages are plain and name the fix. Zod paths leak, no field-level association, no error.tsx at any level.                                                                    |
| 10        | Help and Documentation          | 1         | None. No onboarding, no example content, no template gallery, no tooltips, no cost disclosure, no password reset.                                                              |
| **Total** |                                 | **20/40** | **Acceptable (bottom edge)**                                                                                                                                                   |

Cognitive load: HIGH, 6 of 8 checks fail (single focus, chunking, hierarchy, one-thing-at-a-time, <=4 options, working memory). Eight decision points exceed four visible options: template (9), post type (9), regenerate action (7), tone (6), asset type (6), illustration style (5), two font pickers (5 each), unbounded slide strip.

## Design Specificity Verdict

Two products in one repo, built to different standards; the one the user touches is the weaker one.

The slide renderer is genuinely authored: primitives.tsx:14-93 pins a 44px avatar and theme.ts:16 reserves 44+48 of footer height; theme.ts:42-47 derives card surfaces as alpha-over-text so "Outlined" works on any brand; theme.ts:66-75 steps display 76->68 between 4:5 and 1:1. The fitting doctrine is the product thesis as engineering.

The app around it is interchangeable shadcn CRUD. Four surfaces share one skeleton (mx-auto max-w-5xl px-6 py-10, text-2xl h1, text-sm muted subtitle). globals.css:114-134 is chroma zero on every token except --destructive: Compose has no color of its own. lucide-react is a dependency with zero icons in the app UI; slide nav uses &larr;/&rarr; entities. post-card.tsx:15-23 shows zero pixels of the user's posts on the dashboard.

Deterministic scan: detect.mjs exit 2, 4 findings, one rule (`overused-font` at globals.css:8,16,24,32). ALL FOUR ARE FALSE POSITIVES: those are the Brand Kit @font-face faces Satori renders into PNGs, not app chrome. Inverted miss: the actual UI typeface is Geist via next/font in layout.tsx:5-13, and Geist IS on the overused list but lives in a file the scan does not attribute. Zero findings in any .tsx file.

Measured technical findings (not from the rule set):

- border/input vs background: 1.26:1 (needs 3:1) FAIL. Boundary of every Input, Textarea, SelectTrigger and bordered container.
- Light-mode ring vs background: 2.59:1 (needs 3:1) FAIL; shadcn primitives use ring-ring/50, lower still.
- muted-foreground vs background: 4.73:1, passes by 0.23, carrying real info at 12px in 14 places.
- muted-foreground vs muted: 4.34:1 FAIL but latent (no text on bg-muted today).
- Dark palette fully tokenized and unreachable: .dark never applied, no ThemeProvider, no prefers-color-scheme.
- Editor slide row at 390px needs 416px, has 342px; both arrows shrink-0.
- Largest touch target is 36px; slide chips ~28x24px. Nothing reaches 44px.
- prefers-reduced-motion: zero occurrences in src/.
- Brand Kit fonts: 1.63 MB of unsubsetted TTF, no woff2, no unicode-range, no preload.

Where the assessments disagreed, evidence won and the news was good: form labelling is near-perfect (one unlabelled control, post-editor.tsx:356), zero raw <img>, zero div-click-handlers, 12 of 14 server actions have pending state. The accessibility pass was real work that stopped at labels and never reached contrast, focus rings, touch targets, motion, or error association.

## Overall Impression

Well-engineered product with an under-designed front end; the gap is unusually wide. slide-preview.tsx is an async server component rendering the exact element Satori serializes, as live DOM, which makes preview/export drift impossible rather than unlikely. Then the product refuses to use that renderer anywhere a user makes a decision. Biggest opportunity: put the renderer in front of every decision (thumbnails, template picker, filmstrip, brand preview, export confirmation). One move fixes recognition-over-recall, specificity, and the peak-end inversion at once.

## What's Working

1. Preview/export identity contract architecturally enforced (slide-preview.tsx:11-46 + globals.css:7-84). No per-keystroke network round-trip, no image decode.
2. Fitting policy treats the user's writing as constant and design as variable (slide.ts:25-56 targets vs ceilings; comment at slide.ts:50 shows it was learned, not guessed).
3. Save-correctness model and navigate/reorder split (editor-state.ts:22-47 value-signature comparison with slide id on the draft, unit-tested; post-editor.tsx:137-144 move() follows the slide while arrows only change the view, each with a correct aria-label).

UX copy is the strongest part of the app UI.

## Priority Issues

### [P0] Landing page ships build instructions to production

page.tsx:10 renders "Boilerplate is ready; see tasks.md to start building." No redirect, no auth check. First surface at / for everyone.
Fix: redirect signed-in to /dashboard, else /sign-in, today. Then build the real landing page from spec section 2's before/after with three real generated carousels.
Command: /impeccable shape

### [P0] The editor destroys user work in three ways, with no undo anywhere

1. editor-state.ts:43 + post-editor.tsx:115 cleanup: keystrokes inside the 900ms debounce dropped on slide switch or leave. No beforeunload. The guard itself is correct (prevents cross-slide writes); the flush is missing.
2. post-editor.tsx:232-239: Delete fires on first click. alert-dialog not installed; zero confirm( in the codebase.
3. post-editor.tsx:374-384 + actions.ts:149-172: Regenerate reads from the DB, discarding in-flight edits, then overwrites irreversibly.
   Fix: hoist the debounced payload to a ref and flush synchronously in setActive and at the top of run(); beforeunload guard; install alert-dialog for Delete; mount the Toaster that already exists (sonner installed, ui/sonner.tsx configured, <Toaster/> mounted nowhere, toast() called nowhere) and give delete and regenerate an Undo (actions.ts:144 already holds target.content).
   Command: /impeccable harden

### [P0] First real export is branded with a placeholder handle

brand.ts:73 seeds username "@yourhandle"; primitives.tsx:71-83 draws it in every slide footer; nothing checks. isDefaultBrandKit (brand.ts:83-85) compares only name and username, so a fully configured kit with the default name still reports "not set up".
Fix: deep-compare the kit; warn on /posts/new; block the export routes on a default username or substitute the account name; route new users to /brand once after sign-up.
Command: /impeccable onboard

### [P1] The Brand Kit, the stated differentiator, previews a slide the renderer never produces

brand-preview.tsx:3-6 still says "Stand-in for the real renderer (Phase 6)"; Phase 6 shipped and tasks.md:52 is checked. Card style, illustration style, code block style, logo, and the secondary font's footer role produce no feedback: 6 of 11 controls adjusted blind. Second hidden consequence: slideTheme() resolves from loadBrandKit() at render time, so editing the kit retroactively restyles every post including exported ones, with no notice.
Fix: replace BrandPreview with SlidePreview driven by templates/fixtures.ts, three at once (Cover, Code, Numbered list), passed as ReactNode[] the way posts/[postId]/page.tsx:34-46 already does. Add four starter palettes. Contrast-check background vs text below 4.5:1. Disclose blast radius on save.
Command: /impeccable shape

### [P1] A visual product hides visuals at every decision point, and never says "done"

No dashboard thumbnails (post-card.tsx). Nine layouts as a text dropdown (post-editor.tsx:264-280). Carousel sequence as a row of digits (post-editor.tsx:157-175). Preview hard-coded to 320px (page.tsx:13) so body copy renders at 9.5px and captions at 7.7px, with no zoom. Export is a bare <a download> with no pending and no success state. Peak-end is inverted: the product peaks in the middle and ends on a download shelf.
Fix: cache slide 1's PNG as the PostCard thumbnail at 4:5; replace the template dropdown with a 3x3 grid of fixture renders; replace the number strip with a filmstrip of the previews already rendered and hidden in the DOM (post-editor.tsx:188-192); preview at min(520px, available) with click-to-enlarge; convert export to a client component with pending state and a completion panel (thumbnails, count, dimensions, filename, final-slide CTA ready to copy).
Command: /impeccable layout, then /impeccable delight

## Persona Red Flags

Alex (power user): "/" says the product is unfinished. 20+s generate with no progress or cancel; clicks twice. No keyboard shortcuts, arrow keys inert. Slide 6 to position 2 = four clicks and four router.refresh(). Format switch resets to slide 1. "Download all" gives no feedback; second click triggers a second full Satori render of every slide.

Jordan (first-timer): two stacked dashed empty states with competing CTAs and no ordering. Generates first, gets @yourhandle on a purple-and-black palette that is not hers. Template dropdown with no visual referent; blind, immediate, irreversible. "Visual hint" placeholder database_icon with help text saying to try another word and no list of words; only visible escape is "Generate illustration", styled like "Duplicate", never disclosing a paid image model. Never opens the unstyled <details> at post-editor.tsx:342. No password reset anywhere.

Riley (stress tester): types in slide 1, clicks slide 2 within 900ms, text gone with no warning: reproducible silent data loss. One-click delete. Regenerate before the debounce = two losses in one click. Downloading a single slide flips the whole post to Exported (png/route.ts:20) and rearranges the dashboard. Brand background set to the text color is accepted by hexColorSchema and renders every post invisible. Sign-in tabs emit aria-controls pointing at panels that do not exist (sign-in-form.tsx:57-107, no TabsContent imported).

Sam, developer building a public presence (spec sections 4, 35): grid consistency is a visual judgment and the dashboard is text rows, so the core promise is unverifiable inside the product. The one place to tune it shows a hand-written fake. Configures everything, leaves the name, still told the kit is not set up. His carousel's narrative is represented by numerals. Code slide too small to read, so he exports to check, which marks it Exported. Five minutes later: a zip and silence.

## Minor Observations

- Dead/missing deps: skeleton.tsx and sonner.tsx installed and never imported; next-themes imported only by the unmounted Toaster; lucide-react with zero icons in app UI. tooltip and alert-dialog NOT installed and both needed.
- Zero error.tsx, loading.tsx, not-found.tsx, global-error.tsx anywhere in src/app. Every route fully awaits with no streaming boundary; posts/[postId]/page.tsx:34-46 awaits a Promise.all over every slide render before any markup; notFound() falls through to the stock Next page.
- Refresh storm: every autosave and all 8 run() call sites end in router.refresh(), re-rendering all N previews from scratch and re-running Shiki per code slide, N-1 immediately hidden. One 900ms pause = 1 DB round-trip + N full renders. slide-design.tsx range and color inputs feed the same cycle unthrottled.
- A11y past the labels: zero aria-invalid/aria-describedby at any call site; over-limit counters are color-only in 2 places; /sign-in has no h1 (CardTitle renders a div); Brand Kit "Saved." is a plain span with no live region while its error branch has role="alert"; no skip link; nothing reaches 44px.
- posts/[postId]/page.tsx:53 prints the raw enum lowercase while postTypeLabels exists in create-post-form.tsx. Move to src/types/post.ts.
- Format toggle should read Carousel/Square with ratios secondary.
- app-nav.tsx:21 exact-matches pathname so /posts/[id] highlights nothing; no breadcrumb home from the editor.
- &larr;/&rarr; as button content; use ChevronLeft/ChevronRight.
- Delete sits between Duplicate and Download in one undifferentiated row; slide Delete is variant="outline" while asset Delete is variant="destructive".
- h1 at posts/[postId]/page.tsx:55 has no truncate/line-clamp/break-words; zero break-* utilities in the codebase.
- app-nav has no mobile treatment; contents exceed 342px at 390px and wrap to 2-3 rows.
- Add paste-from-clipboard to asset-uploader.tsx:53-60. Screenshots are the dominant asset and arrive on the clipboard. Highest-value missing interaction on that page.
- Generated illustrations never enter the Asset library (spec section 16 wants them there).
- Zod issue paths leak into user-facing strings.
- deleteAssetAction and changeTemplateAction are the two mutations with no pending gating.
- en-GB leaking in: "Centre" (setting value "center"), aria-label "Background colour" beside "Background color picker", "emphasise".
- Give the first-post empty state a real sample carousel and a "Try this example" button prefilling spec section 7's paragraph.
- dashboard/page.tsx:50 buries the product's own success metric in 12px muted text.
- slide-fields.tsx and slide-design.tsx declare "use client" with no hooks and no browser API.

Deferred scope recommended anyway (user explicitly asked): save a design as a reusable template (spec 15, Backlog) is how "consistently good" becomes true over time and is cheap now that designConfig and PostSpec exist. Caption generation (spec 20, Backlog) is worth most at the export moment and its absence drags spec 34's secondary metric. Streaming generation is not in tasks.md at all; planDesign returns slides in order, so streaming the first validated slide turns a 20s dead wait into ~6s first paint.

## Questions to Consider

1. Why is the carousel the one thing the carousel editor never shows?
2. If the Brand Kit is the differentiator, why did Content Intelligence get a three-stage pipeline with versioned prompts while Visual Identity got a settings page with a fake preview?
3. The renderer measures glyph advances to guarantee the type fits. Why does the preview then shrink it to 9.5px, the one size at which it cannot be evaluated?
4. What is Compose's own visual identity? A tool that sells taste ships zero chroma, one type size per role, and no icon anywhere.
5. What in this interface moves spec section 34's secondary metric? The flow ends at a download shelf.
6. Why ask the user to type database_icon at all? Show the icons and let them click one.
7. Does the editor believe in autosave? It debounces, flashes "Saved" in 12px gray, clears it, offers no undo, and drops keystrokes on slide switch.
8. Why does inspecting one slide mark the whole post exported (png/route.ts:20)?
   CRITIQUE_EOF
   IMPECCABLE_CRITIQUE_META='{"target":"the compose app (full UI/UX review)","total_score":20,"max_score":40,"na_heuristics":"","p0_count":3,"p1_count":2}' node "C:\Users\USER\.claude\skills\impeccable\scripts\critique-storage.mjs" write "src/app" "$TEMP/compose-critique.md" && echo "--- TREND ---" && node "C:\Users\USER\.claude\skills\impeccable\scripts\critique-storage.mjs" trend "src/app" 5; rm -f "$TEMP/compose-critique.md" && echo "temp cleaned"

OUT
Exit code 2
/usr/bin/bash: -c: line 61: unexpected EOF while looking for matching `''
Heredoc quoting tripped over the apostrophes. I'll write the file directly instead.

Write C:\Users\USER\AppData\Local\Temp\claude\c--Users-USER-Desktop-projects-personal-compose\cc44207d-6a8d-4649-ab8a-03d80ee4d822\scratchpad\compose-critique.md
129 lines
Method: dual-agent (A: design review, B: detector + technical evidence), two isolated parallel subagents. No browser automation available; no screenshots, no overlay. All layout and contrast numbers computed from source.

## Design Health Score

| #         | Heuristic                       | Score     | Key Issue                                                                                                                                                                      |
| --------- | ------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1         | Visibility of System Status     | 2         | Export is a bare `<a download>` with zero client state while the server renders N PNGs. Three-stage AI pipeline reports no stage. Zero loading.tsx/Suspense anywhere.          |
| 2         | Match System / Real World       | 3         | Raw enum printed lowercase, format toggle reads "4:5"/"1:1", `database_icon` promoted to user-facing placeholder.                                                              |
| 3         | User Control and Freedom        | 1         | No undo anywhere. Three destructive paths fire on first click. In-flight keystrokes dropped on slide switch. Generation cannot be cancelled.                                   |
| 4         | Consistency and Standards       | 2         | 44 distinct spacing utilities, 7 radii, Delete rendered as outline in one place and destructive in another, Title Case vs sentence case, en-GB leaking into an en-US codebase. |
| 5         | Error Prevention                | 2         | Good counters and disabled submit; zero aria-invalid/aria-describedby at any call site, no confirmations, no beforeunload, hex schema accepts an unreadable color pair.        |
| 6         | Recognition Rather Than Recall  | 2         | Nine layouts chosen by name from a text dropdown. No post thumbnails. Icon vocabulary hidden; fallback for guessing wrong is a paid API call.                                  |
| 7         | Flexibility and Efficiency      | 2         | No keyboard slide navigation, no shortcuts, reorder is one round-trip per position, format switch resets to slide 1.                                                           |
| 8         | Aesthetic and Minimalist Design | 2         | Zero-chroma default shadcn palette, one page template used four times, ~20 flat controls in the editor column.                                                                 |
| 9         | Error Recovery                  | 3         | Messages are plain and name the fix. Zod paths leak, no field-level association, no error.tsx at any level.                                                                    |
| 10        | Help and Documentation          | 1         | None. No onboarding, no example content, no template gallery, no tooltips, no cost disclosure, no password reset.                                                              |
| **Total** |                                 | **20/40** | **Acceptable (bottom edge)**                                                                                                                                                   |

Cognitive load: HIGH, 6 of 8 checks fail (single focus, chunking, hierarchy, one-thing-at-a-time, <=4 options, working memory). Eight decision points exceed four visible options: template (9), post type (9), regenerate action (7), tone (6), asset type (6), illustration style (5), two font pickers (5 each), unbounded slide strip.

## Design Specificity Verdict

Two products in one repo, built to different standards; the one the user touches is the weaker one.

The slide renderer is genuinely authored: primitives.tsx:14-93 pins a 44px avatar and theme.ts:16 reserves 44+48 of footer height; theme.ts:42-47 derives card surfaces as alpha-over-text so "Outlined" works on any brand; theme.ts:66-75 steps display 76->68 between 4:5 and 1:1. The fitting doctrine is the product thesis as engineering.

The app around it is interchangeable shadcn CRUD. Four surfaces share one skeleton (mx-auto max-w-5xl px-6 py-10, text-2xl h1, text-sm muted subtitle). globals.css:114-134 is chroma zero on every token except --destructive: Compose has no color of its own. lucide-react is a dependency with zero icons in the app UI; slide nav uses &larr;/&rarr; entities. post-card.tsx:15-23 shows zero pixels of the user's posts on the dashboard.

Deterministic scan: detect.mjs exit 2, 4 findings, one rule (overused-font at globals.css:8,16,24,32). ALL FOUR ARE FALSE POSITIVES: those are the Brand Kit @font-face faces Satori renders into PNGs, not app chrome. Inverted miss: the actual UI typeface is Geist via next/font in layout.tsx:5-13, and Geist IS on the overused list but lives in a file the scan does not attribute. Zero findings in any .tsx file.

Measured technical findings (not from the rule set):

- border/input vs background: 1.26:1 (needs 3:1) FAIL. Boundary of every Input, Textarea, SelectTrigger and bordered container.
- Light-mode ring vs background: 2.59:1 (needs 3:1) FAIL; shadcn primitives use ring-ring/50, lower still.
- muted-foreground vs background: 4.73:1, passes by 0.23, carrying real info at 12px in 14 places.
- muted-foreground vs muted: 4.34:1 FAIL but latent (no text on bg-muted today).
- Dark palette fully tokenized and unreachable: .dark never applied, no ThemeProvider, no prefers-color-scheme.
- Editor slide row at 390px needs 416px, has 342px; both arrows shrink-0.
- Largest touch target is 36px; slide chips ~28x24px. Nothing reaches 44px.
- prefers-reduced-motion: zero occurrences in src/.
- Brand Kit fonts: 1.63 MB of unsubsetted TTF, no woff2, no unicode-range, no preload.

Where the assessments disagreed, evidence won and the news was good: form labelling is near-perfect (one unlabelled control, post-editor.tsx:356), zero raw img tags, zero div-click-handlers, 12 of 14 server actions have pending state. The accessibility pass was real work that stopped at labels and never reached contrast, focus rings, touch targets, motion, or error association.

## Overall Impression

Well-engineered product with an under-designed front end; the gap is unusually wide. slide-preview.tsx is an async server component rendering the exact element Satori serializes, as live DOM, which makes preview/export drift impossible rather than unlikely. Then the product refuses to use that renderer anywhere a user makes a decision. Biggest opportunity: put the renderer in front of every decision (thumbnails, template picker, filmstrip, brand preview, export confirmation). One move fixes recognition-over-recall, specificity, and the peak-end inversion at once.

## What's Working

1. Preview/export identity contract architecturally enforced (slide-preview.tsx:11-46 + globals.css:7-84). No per-keystroke network round-trip, no image decode.
2. Fitting policy treats the user's writing as constant and design as variable (slide.ts:25-56 targets vs ceilings; comment at slide.ts:50 shows it was learned, not guessed).
3. Save-correctness model and navigate/reorder split (editor-state.ts:22-47 value-signature comparison with slide id on the draft, unit-tested; post-editor.tsx:137-144 move() follows the slide while arrows only change the view, each with a correct aria-label).

UX copy is the strongest part of the app UI.

## Priority Issues

### [P0] Landing page ships build instructions to production

page.tsx:10 renders "Boilerplate is ready; see tasks.md to start building." No redirect, no auth check. First surface at / for everyone.
Fix: redirect signed-in to /dashboard, else /sign-in, today. Then build the real landing page from spec section 2's before/after with three real generated carousels.
Command: /impeccable shape

### [P0] The editor destroys user work in three ways, with no undo anywhere

1. editor-state.ts:43 + post-editor.tsx:115 cleanup: keystrokes inside the 900ms debounce dropped on slide switch or leave. No beforeunload. The guard itself is correct (prevents cross-slide writes); the flush is missing.
2. post-editor.tsx:232-239: Delete fires on first click. alert-dialog not installed; zero confirm() in the codebase.
3. post-editor.tsx:374-384 + actions.ts:149-172: Regenerate reads from the DB, discarding in-flight edits, then overwrites irreversibly.
   Fix: hoist the debounced payload to a ref and flush synchronously in setActive and at the top of run(); beforeunload guard; install alert-dialog for Delete; mount the Toaster that already exists (sonner installed, ui/sonner.tsx configured, Toaster mounted nowhere, toast() called nowhere) and give delete and regenerate an Undo (actions.ts:144 already holds target.content).
   Command: /impeccable harden

### [P0] First real export is branded with a placeholder handle

brand.ts:73 seeds username "@yourhandle"; primitives.tsx:71-83 draws it in every slide footer; nothing checks. isDefaultBrandKit (brand.ts:83-85) compares only name and username, so a fully configured kit with the default name still reports "not set up".
Fix: deep-compare the kit; warn on /posts/new; block the export routes on a default username or substitute the account name; route new users to /brand once after sign-up.
Command: /impeccable onboard

### [P1] The Brand Kit, the stated differentiator, previews a slide the renderer never produces

brand-preview.tsx:3-6 still says "Stand-in for the real renderer (Phase 6)"; Phase 6 shipped and tasks.md:52 is checked. Card style, illustration style, code block style, logo, and the secondary font's footer role produce no feedback: 6 of 11 controls adjusted blind. Second hidden consequence: slideTheme() resolves from loadBrandKit() at render time, so editing the kit retroactively restyles every post including exported ones, with no notice.
Fix: replace BrandPreview with SlidePreview driven by templates/fixtures.ts, three at once (Cover, Code, Numbered list), passed as ReactNode[] the way posts/[postId]/page.tsx:34-46 already does. Add four starter palettes. Contrast-check background vs text below 4.5:1. Disclose blast radius on save.
Command: /impeccable shape

### [P1] A visual product hides visuals at every decision point, and never says "done"

No dashboard thumbnails (post-card.tsx). Nine layouts as a text dropdown (post-editor.tsx:264-280). Carousel sequence as a row of digits (post-editor.tsx:157-175). Preview hard-coded to 320px (page.tsx:13) so body copy renders at 9.5px and captions at 7.7px, with no zoom. Export is a bare download link with no pending and no success state. Peak-end is inverted: the product peaks in the middle and ends on a download shelf.
Fix: cache slide 1's PNG as the PostCard thumbnail at 4:5; replace the template dropdown with a 3x3 grid of fixture renders; replace the number strip with a filmstrip of the previews already rendered and hidden in the DOM (post-editor.tsx:188-192); preview at min(520px, available) with click-to-enlarge; convert export to a client component with pending state and a completion panel (thumbnails, count, dimensions, filename, final-slide CTA ready to copy).
Command: /impeccable layout, then /impeccable delight

## Persona Red Flags

Alex (power user): "/" says the product is unfinished. 20+s generate with no progress or cancel; clicks twice. No keyboard shortcuts, arrow keys inert. Slide 6 to position 2 = four clicks and four router.refresh(). Format switch resets to slide 1. "Download all" gives no feedback; second click triggers a second full Satori render of every slide.

Jordan (first-timer): two stacked dashed empty states with competing CTAs and no ordering. Generates first, gets @yourhandle on a purple-and-black palette that is not hers. Template dropdown with no visual referent; blind, immediate, irreversible. "Visual hint" placeholder database_icon with help text saying to try another word and no list of words; only visible escape is "Generate illustration", styled like "Duplicate", never disclosing a paid image model. Never opens the unstyled details element at post-editor.tsx:342. No password reset anywhere.

Riley (stress tester): types in slide 1, clicks slide 2 within 900ms, text gone with no warning: reproducible silent data loss. One-click delete. Regenerate before the debounce = two losses in one click. Downloading a single slide flips the whole post to Exported (png/route.ts:20) and rearranges the dashboard. Brand background set to the text color is accepted by hexColorSchema and renders every post invisible. Sign-in tabs emit aria-controls pointing at panels that do not exist (sign-in-form.tsx:57-107, no TabsContent imported).

Sam, developer building a public presence (spec sections 4, 35): grid consistency is a visual judgment and the dashboard is text rows, so the core promise is unverifiable inside the product. The one place to tune it shows a hand-written fake. Configures everything, leaves the name, still told the kit is not set up. His carousel's narrative is represented by numerals. Code slide too small to read, so he exports to check, which marks it Exported. Five minutes later: a zip and silence.

## Minor Observations

- Dead/missing deps: skeleton.tsx and sonner.tsx installed and never imported; next-themes imported only by the unmounted Toaster; lucide-react with zero icons in app UI. tooltip and alert-dialog NOT installed and both needed.
- Zero error.tsx, loading.tsx, not-found.tsx, global-error.tsx anywhere in src/app. Every route fully awaits with no streaming boundary; posts/[postId]/page.tsx:34-46 awaits a Promise.all over every slide render before any markup; notFound() falls through to the stock Next page.
- Refresh storm: every autosave and all 8 run() call sites end in router.refresh(), re-rendering all N previews from scratch and re-running Shiki per code slide, N-1 immediately hidden. One 900ms pause = 1 DB round-trip + N full renders. slide-design.tsx range and color inputs feed the same cycle unthrottled.
- A11y past the labels: zero aria-invalid/aria-describedby at any call site; over-limit counters are color-only in 2 places; /sign-in has no h1 (CardTitle renders a div); Brand Kit "Saved." is a plain span with no live region while its error branch has role="alert"; no skip link; nothing reaches 44px.
- posts/[postId]/page.tsx:53 prints the raw enum lowercase while postTypeLabels exists in create-post-form.tsx. Move to src/types/post.ts.
- Format toggle should read Carousel/Square with ratios secondary.
- app-nav.tsx:21 exact-matches pathname so /posts/[id] highlights nothing; no breadcrumb home from the editor.
- Arrow entities as button content; use ChevronLeft/ChevronRight.
- Delete sits between Duplicate and Download in one undifferentiated row; slide Delete is variant="outline" while asset Delete is variant="destructive".
- h1 at posts/[postId]/page.tsx:55 has no truncate/line-clamp/break-words; zero break-* utilities in the codebase.
- app-nav has no mobile treatment; contents exceed 342px at 390px and wrap to 2-3 rows.
- Add paste-from-clipboard to asset-uploader.tsx:53-60. Screenshots are the dominant asset and arrive on the clipboard. Highest-value missing interaction on that page.
- Generated illustrations never enter the Asset library (spec section 16 wants them there).
- Zod issue paths leak into user-facing strings.
- deleteAssetAction and changeTemplateAction are the two mutations with no pending gating.
- en-GB leaking in: "Centre" (setting value "center"), aria-label "Background colour" beside "Background color picker", "emphasise".
- Give the first-post empty state a real sample carousel and a "Try this example" button prefilling spec section 7's paragraph.
- dashboard/page.tsx:50 buries the product's own success metric in 12px muted text.
- slide-fields.tsx and slide-design.tsx declare "use client" with no hooks and no browser API.

Deferred scope recommended anyway (user explicitly asked): save a design as a reusable template (spec 15, Backlog) is how "consistently good" becomes true over time and is cheap now that designConfig and PostSpec exist. Caption generation (spec 20, Backlog) is worth most at the export moment and its absence drags spec 34's secondary metric. Streaming generation is not in tasks.md at all; planDesign returns slides in order, so streaming the first validated slide turns a 20s dead wait into ~6s first paint.

## Questions to Consider

1. Why is the carousel the one thing the carousel editor never shows?
2. If the Brand Kit is the differentiator, why did Content Intelligence get a three-stage pipeline with versioned prompts while Visual Identity got a settings page with a fake preview?
3. The renderer measures glyph advances to guarantee the type fits. Why does the preview then shrink it to 9.5px, the one size at which it cannot be evaluated?
4. What is Compose's own visual identity? A tool that sells taste ships zero chroma, one type size per role, and no icon anywhere.
5. What in this interface moves spec section 34's secondary metric? The flow ends at a download shelf.
6. Why ask the user to type database_icon at all? Show the icons and let them click one.
7. Does the editor believe in autosave? It debounces, flashes "Saved" in 12px gray, clears it, offers no undo, and drops keystrokes on slide switch.
8. Why does inspecting one slide mark the whole post exported (png/route.ts:20)?
   Bash Persist critique snapshot and read trend
   IN
   cd "C:\Users\USER\Desktop\projects\personal\compose" && export IMPECCABLE_CRITIQUE_META='{"target":"the compose app (full UI/UX review)","total_score":20,"max_score":40,"na_heuristics":"","p0_count":3,"p1_count":2}' && node "C:\Users\USER\.claude\skills\impeccable\scripts\critique-storage.mjs" write "src/app" "C:/Users/USER/AppData/Local/Temp/claude/c--Users-USER-Desktop-projects-personal-compose/cc44207d-6a8d-4649-ab8a-03d80ee4d822/scratchpad/compose-critique.md" && echo "--- TREND ---" && node "C:\Users\USER\.claude\skills\impeccable\scripts\critique-storage.mjs" trend "src/app" 5; rm -f "C:/Users/USER/AppData/Local/Temp/claude/c--Users-USER-Desktop-projects-personal-compose/cc44207d-6a8d-4649-ab8a-03d80ee4d822/scratchpad/compose-critique.md" && echo "temp cleaned"

OUT
C:\Users\USER\Desktop\projects\personal\compose\.impeccable\critique\2026-09-15T14-06-18Z__src-app.md
--- TREND ---
[
{
"target": "the compose app (full UI/UX review)",
"total_score": 20,
"max_score": 40,
"na_heuristics": "",
"p0_count": 3,
"p1_count": 2,
"timestamp": "2026-09-15T14-06-18Z",
"slug": "src-app"
}
]
temp cleaned
Trend for src-app: 20/40. First run for this target, so no trend yet.
Wrote .impeccable/critique/2026-09-15T14-06-18Z__src-app.md.

Two things worth flagging before you pick a direction. First, tasks.md has "Responsive pass and accessibility pass" checked off — that work was real (labels and pending states are genuinely good) but it stopped before contrast, focus rings, touch targets, motion, and error association, and the editor still overflows at 390px. Second, the three P0s are cheap relative to their damage: the landing page is a two-line redirect, and the data-loss fixes are a ref flush plus mounting a Toaster you already have installed.
