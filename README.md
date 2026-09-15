# Compose

Your personal AI content designer. Compose turns rough ideas, project updates and lessons into polished, on-brand Instagram posts and carousels, without needing design skills.

- Product spec: [`docs/spec.md`](docs/spec.md)
- Build plan: [`tasks.md`](tasks.md)
- Conventions: [`AGENTS.md`](AGENTS.md)

## Stack

Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui, PostgreSQL + Drizzle, Better Auth, OpenAI, Vercel Blob, Vercel.

## Getting started

Requires Node 20+ and pnpm.

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
pnpm db:migrate              # once the schema exists
pnpm dev
```

Open http://localhost:3000.

## Scripts

| Script             | What it does                         |
| ------------------ | ------------------------------------ |
| `pnpm dev`         | Start the dev server                 |
| `pnpm build`       | Production build                     |
| `pnpm typecheck`   | TypeScript check                     |
| `pnpm lint`        | ESLint                               |
| `pnpm test`        | Vitest                               |
| `pnpm format`      | Prettier                             |
| `pnpm db:generate` | Generate a migration from the schema |
| `pnpm db:migrate`  | Apply migrations                     |
| `pnpm db:studio`   | Open Drizzle Studio                  |
