# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

- `npm run dev` — Start dev server (NODE_ENV=development)
- `npm run build` — Production build (runs `prisma generate` then `vite build`)
- `npm run check` — Svelte type checking
- `npm run test` — Run tests with Vitest
- `npm run test:e2e` — Run Playwright end-to-end tests
- `npm run lint` — Check formatting with Prettier
- `npm run format` — Auto-format with Prettier
- `npx prisma migrate dev --name <name>` — Create a database migration (always use this, never just `db push`)
- `npx prisma generate` — Regenerate Prisma client after schema changes

## Tech Stack

- **Framework**: SvelteKit (Svelte 5) with TypeScript, deployed on Vercel (`adapter-vercel`)
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite` plugin) + Skeleton UI v4 (`@skeletonlabs/skeleton-svelte`)
- **Database**: PostgreSQL via Prisma 7 (with `@prisma/adapter-pg` driver adapter). Connection uses `DIRECT_URL` or `DATABASE_URL` env vars.
- **Auth**: Lucia v2 with Steam OpenID (`node-steam-openid`). Auth request is attached to `event.locals.auth` in `hooks.server.ts`.
- **Testing**: Vitest + `@testing-library/svelte` for unit tests, Playwright for E2E
- **Content**: MDsveX for markdown pages (blog)
- **External APIs**: OpenDota and Stratz for Dota 2 match data (`src/lib/services/od_stratz.ts`, `src/lib/server/opendota.ts`)

## Project Architecture

TurboDota is a Dota 2 companion web app with multiple features built as separate route groups:

### Core Features (Route Groups)
- `/incremental` — **Incremental idle game** (the most active area of development). Players manage heroes from their real Dota matches in an idle RPG system.
- `/dotadeck` — Card-based Dota game mode
- `/cards` — Card collection/battler system
- `/herostats`, `/winrates` — Match statistics and analytics
- `/feed` — Activity feed
- `/turbotown` — Town-building feature
- `/blog` — MDsveX-powered blog posts

### Incremental Game System (`src/lib/incremental/`)
This is the largest subsystem. Key modules:
- `engine/` — Battle state machine and combat logic (`battle-state.ts`)
- `actions/` — Timed action definitions and reward calculations (server-side in `action-rewards.server.ts`)
- `upgrades/` — Upgrade tree and purchase logic (`upgrade-service.ts`)
- `bank/` — Currency/item banking system
- `quests/` — Quest definitions and claim logic
- `run/` — Run progression (prestige/reset mechanic)
- `map/` — Atlas/map exploration
- `stats/` — Derived stat calculations for heroes
- `stores/` — Svelte stores for client-side incremental game state
- `components/` — Svelte components (HeroCard, BattleCard, ActionCard, etc.)
- `constants/` — Currency definitions, item definitions
- `types.ts` — Shared type definitions for the incremental system
- `data/` — Static game data

Incremental API routes live under `src/routes/api/incremental/` with endpoints for actions, bank, roster, saves, quests, items, history, talents, training, etc.

### Server-Side Code (`src/lib/server/`)
- `prisma.ts` — Prisma client singleton (exports `default`)
- `lucia.ts` — Lucia auth configuration
- `incremental-save.ts` — Save/load game state
- `incremental-hero-resolver.ts` — Resolves hero data
- `incremental-battle-cache.ts` — Battle state caching
- `opendota.ts` — OpenDota API client
- `dotadeck.ts` — DotaDeck server logic

### API Pattern
All API routes follow SvelteKit conventions at `src/routes/api/`. Endpoints export `GET`/`POST`/etc. handler functions. Auth is validated via `event.locals.auth.validate()`.

## Prisma / Database Migrations

**Always create migrations** when changing `prisma/schema.prisma`:
```
npx prisma migrate dev --name <descriptive_name>
```
Never use only `prisma db push` for tracked changes. Never manually edit applied migration files. See `.cursorrules` for full migration policy.

## Frontend Conventions

- Always use Skeleton UI v4 (`@skeletonlabs/skeleton-svelte`), Tailwind CSS v4, and Svelte 5 for all components and styling
- Always write automated tests (Vitest + `@testing-library/svelte`) for new frontend features

## Key Conventions

- Path aliases: `$lib` → `src/lib`, `$mocks` → `src/mocks`
- Server-only code uses `.server.ts` suffix or lives in `src/lib/server/`
- Documentation goes in `docs/<feature>/` subdirectories
- Prefer existing dependencies (Skeleton UI, bits-ui, tailwind-merge) over adding new packages
- Cron job configured at `/api/cron` (runs hourly via Vercel cron)
- Migration tools that fail (TTY errors, interactive prompts) should not be worked around — ask the user to run them manually
