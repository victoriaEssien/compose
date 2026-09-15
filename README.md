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

## Deploying

Vercel runs `pnpm vercel-build`, which applies pending Drizzle migrations before
building. A failed migration fails the deploy, so broken schema never ships.

Note that preview deployments run it too. Point the Preview environment at its own
Neon branch, or a preview build will migrate whatever database its
`DATABASE_URL` names.

Environment variables, split by how they should be stored:

| Variable                | Kind   | Notes                                                        |
| ----------------------- | ------ | ------------------------------------------------------------ |
| `DATABASE_URL`          | secret | Neon connection string                                       |
| `BETTER_AUTH_SECRET`    | secret | Signs session cookies. Use a different value per environment |
| `OPENAI_API_KEY`        | secret |                                                              |
| `BLOB_READ_WRITE_TOKEN` | secret | Injected automatically when the Blob store is connected      |
| `NEXT_PUBLIC_APP_URL`   | config | Compiled into the browser bundle, so never a secret          |
| `BETTER_AUTH_URL`       | config | The deployed origin                                          |
| `OPENAI_MODEL`          | config |                                                              |

`BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` must both point at the deployed origin.
Vercel-generated hostnames are trusted automatically through `VERCEL_URL` and
`VERCEL_PROJECT_PRODUCTION_URL`, so sign-in works on preview URLs too.

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
