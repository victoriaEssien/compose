# Compose: AI Instagram Content Designer

> Task tracking lives in [`tasks.md`](../tasks.md) at the repo root. This file is the product spec.

## 1. Overview

An AI-powered Instagram content creation tool that turns raw written content into polished, branded Instagram posts and carousels.

The user provides the content. The application determines the appropriate post structure, generates the copy/layout, creates the visual design, and produces ready-to-publish Instagram graphics.

The product is essentially: **Rhema.art, but for social media content.**

The first version is designed primarily around the creator's own workflow: turning technical ideas, project updates, tutorials, opinions, and discoveries into consistent Instagram content without requiring graphic design skills.

## 2. Problem

Creating the content isn't necessarily the difficult part. The difficult part is turning that content into something visually appealing.

Current workflow:

```text
Have an idea
    ↓
Write the content
    ↓
Open Canva/Figma
    ↓
Figure out a layout
    ↓
Design every slide
    ↓
Resize/fix spacing
    ↓
Export
    ↓
Post
```

The design step creates enough friction that posting becomes inconsistent.

The product removes that friction:

```text
Have an idea
    ↓
Paste content
    ↓
AI designs the post
    ↓
Review
    ↓
Export / Publish
```

## 3. Product Goal

Make creating a high-quality Instagram post take minutes instead of an hour.

The user should be able to go from "I have something I want to post" to "I have a finished Instagram carousel" without needing graphic design skills.

## 4. Target User

Primary user: a developer, designer, creator, or technical professional who:

- has things they want to share
- isn't particularly good at graphic design
- wants their content to look consistently good
- wants to post regularly
- doesn't want to spend significant time designing each post

Initial target persona: software developers building a public presence.

## 5. Core Product Principle

The AI should not simply generate random pretty graphics. It should create content that belongs to the user's visual identity.

For example, if the user's brand is minimal, technical, slightly playful, editorial and recognizable, then every generated post should feel like it came from the same account.

The product therefore has two separate concepts:

- **Content Intelligence:** what should this post say and how should it be structured?
- **Visual Identity:** what should this user's posts look like?

## 6. Core Workflow

```text
Create Post
    ↓
Enter Content
    ↓
AI analyzes content
    ↓
Determine post type
    ↓
Generate structure
    ↓
Generate visual design
    ↓
Preview
    ↓
Edit / Regenerate
    ↓
Export
```

Future:

```text
Export
    ↓
Publish directly to Instagram
```

## 7. Content Input

The user should be able to paste rough content. Example:

> I spent the last two days debugging this API and eventually realized the problem wasn't the API at all. I was making three database calls where one would have been enough.

The user does NOT need to format it. The AI should transform rough input into a usable post.

### Input fields

- **Content:** large text area.
- **Optional context:** e.g. "This is for developers.", "Keep it funny.", "Make it educational.", "I want this to be a carousel."
- **Post type (optional):** Auto, Educational, Tutorial, Project, Opinion, Story, Things I learned, Tool recommendation, Announcement.

If Auto is selected, the AI determines the best format.

## 8. Post Types

Initial supported formats:

| Type                          | Example                                                          |
| ----------------------------- | ---------------------------------------------------------------- |
| Educational                   | 3 things I learned about caching                                 |
| Tutorial                      | How to add authentication to a Next.js app                       |
| Project Showcase              | I built an open-source finder called Tracer.                     |
| Things I Learned              | Things I learned while building my first AI app.                 |
| Opinion                       | You probably don't need microservices yet.                       |
| Tool / Website Recommendation | A website every developer should know about.                     |
| Story                         | I spent three hours debugging a problem caused by one character. |

## 9. Carousel Generation

The AI should determine whether the content benefits from a carousel. For example:

```text
Slide 1  HOOK
Slide 2  Problem
Slide 3  Point #1
Slide 4  Point #2
Slide 5  Point #3
Slide 6  Takeaway
```

The AI should avoid overcrowding slides. Each slide should have:

- clear hierarchy
- short text
- strong readability
- appropriate whitespace

## 10. Visual Design System

Each user has a **Brand Kit**. The Brand Kit controls the visual identity of generated posts.

Brand Kit fields:

- Brand name
- Username
- Logo
- Avatar/character
- Primary font
- Secondary font
- Background colors
- Text colors
- Accent colors
- Border radius
- Card style
- Illustration style
- Code block style

Example:

```text
Brand         The Codebreaker.exe
Primary font  Inter
Style         Minimal / editorial / technical
Accent        [custom color]
Avatar        [uploaded/generated character]
```

## 11. Templates

The application should use a collection of reusable design structures rather than generating every layout completely from scratch.

Initial templates:

| Template      | Description                      |
| ------------- | -------------------------------- |
| Cover         | Large headline + visual element  |
| Text          | Heading + supporting text        |
| Code          | Code snippet + explanation       |
| Comparison    | Before / After or A vs B         |
| Numbered List | 01, 02, 03                       |
| Screenshot    | Screenshot + annotation          |
| Quote         | Large statement + attribution    |
| Project       | Project screenshot + description |
| Final Slide   | Summary + CTA                    |

The AI chooses which layouts to use.

## 12. Design Generation

The AI should generate a structured design specification, rather than relying entirely on image generation.

Example internal representation:

```json
{
  "type": "carousel",
  "slides": [
    {
      "template": "cover",
      "headline": "You probably don't need Redis yet",
      "visual": "database_icon"
    },
    {
      "template": "text",
      "headline": "Start with your database",
      "body": "..."
    }
  ]
}
```

The application renderer then turns that specification into actual graphics. This provides:

- consistent typography
- editable text
- predictable layouts
- better rendering quality
- reproducible designs
- easier regeneration

AI image generation can be used selectively for illustrations, decorative elements, custom artwork, backgrounds and avatars. **It should not be responsible for rendering important text.**

## 13. Editor

After generation, the user can edit the result. Minimum editor capabilities:

- Edit text
- Change slide order
- Regenerate slide
- Duplicate slide
- Delete slide
- Change template
- Change visual
- Adjust font size
- Adjust colors
- Edit CTA

The user should not need a full Canva-like editor. The goal is lightweight correction, not professional graphic design.

## 14. Regeneration

Each slide should have a **Regenerate** button. Options:

- Rewrite
- Make shorter
- Make clearer
- Make funnier
- Make more technical
- Change layout
- Generate another design

Example: "Make this slide less wordy." The AI modifies only that slide.

## 15. Brand Consistency

Every generation should reference the user's Brand Kit. The AI should maintain:

- typography
- colors
- spacing
- visual language
- recurring components
- avatar usage
- CTA style

The user should be able to save a successful design as a reusable template.

## 16. Image / Asset Library

Users can upload screenshots, project images, logos, avatars, illustrations and photos. Assets can then be reused across posts.

```text
My Assets

Avatar
Tracer screenshot
Slakker screenshot
GitHub screenshot
Logo
```

## 17. AI Features

- **Content Analyzer:** determines topic, audience, tone, post type, complexity, likely carousel length.
- **Content Structurer:** turns rough content into hook, body, supporting points, conclusion, CTA.
- **Design Planner:** chooses number of slides, layout per slide, visual elements, typography hierarchy.
- **Copy Assistant:** can shorten, expand, simplify, make more technical, make more conversational, generate hooks, generate CTAs.
- **Visual Assistant:** can suggest illustration, icon, screenshot, diagram, code block, decorative element.

## 18. Export

Initial export formats:

- Instagram Carousel: **1080 × 1350 px**
- Instagram Square: **1080 × 1080 px**

Future: Instagram Stories, Reels covers, LinkedIn posts, X graphics.

## 19. Instagram Publishing

Not required for MVP.

Future workflow: Generate → Review → Publish to Instagram.

The user should be able to connect Instagram, select account, write caption, select hashtags, publish, and optionally schedule. The application should use official Meta APIs rather than browser automation.

## 20. Caption Generation

When publishing is implemented, the AI can generate an Instagram caption, CTA and hashtags.

```text
I spent way too long debugging this...

Turns out the problem wasn't the API.
It was three unnecessary database calls.

Here's what I changed ↓
```

The caption should be editable before publishing.

## 21. Dashboard

Simple dashboard:

```text
Your Content

[ + Create Post ]

Recent Posts
[Post] [Post] [Post]

Drafts
[Draft] [Draft]

Brand Kit
```

Do not build analytics-heavy dashboards initially.

## 22. Post Creation Screen

Primary interface:

```text
Create a post

What do you want to talk about?

┌───────────────────────────────┐
│ Paste your content here...    │
│                               │
│                               │
└───────────────────────────────┘

Post type
[ Auto ▼ ]

Tone
[ Your brand voice ▼ ]

[ Generate ]
```

After generation:

```text
Your Post

← Slide 1 →  Slide 2  Slide 3  Slide 4

        [ PREVIEW ]

[ Edit ] [ Regenerate ] [ Download ]
```

## 23. MVP

The MVP should not attempt to build the entire social media platform.

### MVP includes

- Authentication
- Dashboard
- Brand Kit
- Create Post
- Raw content input
- AI content analysis
- AI carousel structure
- 5–8 design templates
- Deterministic graphic rendering
- Basic image uploads
- Slide preview
- Edit text
- Regenerate slide
- Export PNGs
- Save drafts

### MVP does NOT include

- Instagram publishing
- Scheduling
- Analytics
- Team collaboration
- Multiple social platforms
- Complex drag-and-drop editor
- AI video generation
- Content calendar
- Automated posting

## 24. Technical Stack

| Layer          | Choice                                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend       | Next.js, TypeScript, Tailwind CSS, shadcn/ui                                                                                            |
| Backend        | Next.js API routes / server actions                                                                                                     |
| Database       | PostgreSQL + Drizzle ORM                                                                                                                |
| Authentication | Better Auth (chosen for the boilerplate; Clerk was the alternative)                                                                     |
| AI             | OpenAI API: content analysis, copy generation, design planning, structured output. Image generation only selectively, for visual assets |
| Rendering      | Deterministic HTML/CSS-based rendering (see `AGENTS.md`)                                                                                |
| Storage        | Vercel Blob                                                                                                                             |
| Hosting        | Vercel                                                                                                                                  |

The important architectural principle:

```text
AI decides WHAT
Renderer decides HOW
```

Do not ask an image model to generate an entire Instagram carousel containing important text.

## 25. Core Data Model

**User:** id, email, name, createdAt

**Brand:** id, userId, name, username, fonts, colors, style, avatar, logo, createdAt, updatedAt

**Asset:** id, userId, name, type, url, createdAt

**Post:** id, userId, title, type, status, originalContent, generatedContent, createdAt, updatedAt

**Slide:** id, postId, order, template, content, designConfig, imageUrl

**Template:** id, name, type, configuration

## 26. AI Architecture

The AI should return structured JSON:

```json
{
  "postType": "educational",
  "slideCount": 5,
  "slides": [
    { "template": "cover", "headline": "...", "body": null },
    { "template": "text", "headline": "...", "body": "..." }
  ]
}
```

The backend validates the response before rendering. The renderer then converts the structured representation into images. This separation is important.

```text
User Content
     ↓
AI
     ↓
Structured Post JSON
     ↓
Validation
     ↓
Renderer
     ↓
PNG
```

## 27. Brand Voice

The user should eventually be able to define how the AI writes.

```text
My voice

Direct
Technical
Funny when appropriate
No excessive slang
No corporate language
No motivational fluff
```

The AI should use this when generating hooks, slide copy, captions and CTAs.

## 28. Future: Personal Content Memory

The application could eventually learn from previously created posts: common topics, preferred formats, successful hooks, frequently used phrases, visual preferences, recurring series (e.g. Things I Built, Things I Learned, Useful Websites, Dev Thoughts, Debugging Stories).

The AI could then suggest: "This would work well as a Things I Learned carousel."

## 29. Future: Content Ideas

Generate ideas based on GitHub projects, recent commits, saved links, uploaded notes and previous posts.

```text
You recently built Tracer.

Potential posts:
1. Why I built Tracer
2. How I discovered the problem
3. What I learned building it
4. 3 open-source discovery tools I found
5. How Tracer works
```

This creates a direct connection between building and publishing.

## 30. Future: GitHub Integration

Connect GitHub. The system can identify potential content from repositories, releases, interesting commits, README files, technologies used and project milestones.

```text
You shipped a new version of Tracer.
Create a post?
[Yes, generate it]
```

## 31. Future: Direct Publishing

Connect Instagram through Meta's official APIs.

```text
Generate → Review → Caption → Preview → Publish
```

Later: `Schedule for [ Friday 6:00 PM ]`

## 32. Future: Multi-platform

The same content could eventually be adapted for Instagram, LinkedIn, X, Threads and TikTok carousel/photo posts. The user creates the idea once; the AI adapts it to each platform.

## 33. Product Differentiator

The product should not compete by saying "We generate AI Instagram posts." That market is crowded.

The stronger positioning is: **Your personal AI content designer.**

It understands what you talk about, how you write, what your brand looks like, what formats you use, and what you've built, and turns rough ideas into content that actually looks like you.

## 34. MVP Success Metric

Primary metric: **time from idea → publishable post.** Target: a polished carousel in under 5 minutes.

Secondary metric: percentage of generated posts the user actually publishes. If users generate 20 posts but publish 2, the product isn't solving the real problem.

## 35. Initial Personal Use Case

The first user is the creator herself. Her workflow should become:

```text
Build something → Have an idea / lesson / opinion → Open the app → Paste it → Generate → Review → Publish
```

Example content:

- **I BUILT THIS:** "I built Tracer because finding useful open-source projects shouldn't feel like searching through a graveyard of GitHub repositories." → AI creates a branded carousel.
- **THINGS I LEARNED:** "Three things I learned while building an AI image generation app." → AI creates another branded carousel.
- **YOU MIGHT LIKE THIS:** "This website lets you..." → AI creates another branded post.

## 36. Product Vision

Eventually, the product becomes a personal content operating system:

```text
Things you build
Things you learn
Things you discover
Things you think
       ↓
       AI
       ↓
    Content
       ↓
Instagram / LinkedIn / X
       ↓
   Visibility
       ↓
 Opportunities
```

The long-term product isn't really an Instagram graphics generator. It is a system that makes sharing your work almost effortless.

## 37. One-Sentence Definition

An AI content designer that turns your ideas, projects, and knowledge into polished, on-brand social media posts without requiring you to know how to design.
