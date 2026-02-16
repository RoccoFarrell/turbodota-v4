# TurboDota v4

The SvelteKit repository for [TurboDota.com: The Tracker for Turbo](https://www.turbodota.com)

This is the 4th iteration of our Turbo Dota tracking site:

- v1 - Vue and Firebase
- v2 - React and Firebase
- v3 - SvelteKit and no database
- v4 - SvelteKit with PostgreSQL/Supabase

## Tech Stack

- [SvelteKit](https://kit.svelte.dev/) - Full-stack Svelte framework
- [Skeleton UI](https://www.skeleton.dev/) - UI component library
- [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first CSS framework
- [Prisma](https://www.prisma.io/) - Database ORM with PostgreSQL
- [Supabase](https://supabase.com/) - PostgreSQL database hosting and local development
- [Lucia Auth](https://lucia-auth.com/) - Authentication library with Steam OpenID
- [OpenDota API](https://docs.opendota.com/) & [Stratz API](https://stratz.com/) - Dota 2 match data
- [Vitest](https://vitest.dev/) - Unit testing
- [Playwright](https://playwright.dev/) - E2E testing

## Getting Started

Follow these steps to run the project locally from scratch:

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (required for Supabase local emulator)
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) - Install via:
  ```bash
  npm install -g supabase
  ```

### 1. Clone and Install

```bash
git clone <repository-url>
cd turbodota-v4
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory (or copy from `.env.development`):

```env
# Base URL for the application
BASE_URL="http://localhost:5173"

# PostgreSQL connection strings (local Supabase)
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Optional: Stratz API token for enhanced Dota 2 data
STRATZ_TOKEN="your_token_here"
```

### 3. Start Local Supabase

The project uses Supabase's local emulator which runs a full PostgreSQL database in Docker:

```bash
# Start Supabase (first run will download Docker images)
supabase start
```

This command starts:
- **PostgreSQL** on port `54322` (database)
- **Supabase Studio** on port `54323` (database GUI at http://127.0.0.1:54323)
- **Kong API Gateway** on port `54321` (API)
- **GoTrue** (auth server)
- **Inbucket** on port `54324` (email testing)

Check that all services are running:

```bash
supabase status
```

You should see output like:

```
         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbG...
service_role key: eyJhbG...
```

### 4. Database Setup

Push the Prisma schema to your local database:

```bash
# Generate Prisma client and push schema
npm run prisma
```

This runs:
```bash
npx prisma generate && npx prisma db push
```

To view and manage your database, open Supabase Studio at http://127.0.0.1:54323

### 5. Start Development Server

```bash
npm run dev

# Or open in browser automatically
npm run dev -- --open
```

The app will be available at http://localhost:5173

## Development Workflow

### Database Management

#### Viewing the Database
Access Supabase Studio at http://127.0.0.1:54323 to:
- Browse tables and data
- Run SQL queries
- View relationships
- Monitor real-time changes

#### Making Schema Changes
**Always use migrations** (never just `db push` for tracked changes):

```bash
# Create a new migration
npx prisma migrate dev --name <descriptive_name>

# Example
npx prisma migrate dev --name add_user_preferences
```

#### Resetting the Database

```bash
# Reset database and run seed
npm run prisma:reset

# Or manually
npx prisma migrate reset
```

#### Seeding Data

```bash
npm run prisma:seed
```

The seed file is located at `prisma/seed.ts`.

### Stopping/Restarting Supabase

```bash
# Stop all Supabase services
supabase stop

# Start again (data persists)
supabase start

# Reset everything (deletes all data)
supabase stop --no-backup
supabase start
```

### Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Production build
npm run preview          # Preview production build
npm run check            # Run Svelte type checking
npm run test             # Run unit tests with Vitest
npm run test:ui          # Run tests with UI
npm run test:e2e         # Run Playwright E2E tests
npm run lint             # Check code formatting
npm run format           # Auto-format code with Prettier
npm run prisma           # Generate client and push schema
npm run prisma:reset     # Reset database and seed
npm run prisma:seed      # Run seed file
```

## Project Structure

```
turbodota-v4/
├── src/
│   ├── routes/              # SvelteKit routes
│   │   ├── api/            # API endpoints
│   │   ├── incremental/    # Incremental idle game
│   │   ├── dotadeck/       # Card-based game mode
│   │   ├── cards/          # Card collection system
│   │   └── ...
│   ├── lib/                # Shared library code
│   │   ├── server/         # Server-only code
│   │   ├── incremental/    # Incremental game logic
│   │   ├── components/     # Shared Svelte components
│   │   └── services/       # External API services
│   └── hooks.server.ts     # SvelteKit hooks (auth)
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts            # Database seed script
│   └── migrations/        # Database migrations
├── supabase/
│   └── config.toml        # Supabase local config
├── static/                # Static assets
├── tests/                 # Test files
└── docs/                  # Documentation

```

## Testing

### Unit Tests (Vitest)

```bash
npm run test        # Run once
npm run test:watch  # Watch mode
npm run test:ui     # Interactive UI
npm run coverage    # Coverage report
```

### E2E Tests (Playwright)

```bash
npm run test:e2e
```

## Deployment

The project is configured for deployment on [Vercel](https://vercel.com/) using `@sveltejs/adapter-vercel`.

### Production Environment Variables

Set these in your production environment (e.g., Vercel dashboard):

```env
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true&connection_limit=10"
DIRECT_URL="postgresql://user:password@host:5432/postgres"
STRATZ_TOKEN="your_production_token"
```

The `DATABASE_URL` uses Supabase's connection pooler (pgBouncer) for serverless environments, while `DIRECT_URL` connects directly for migrations.

### Build and Deploy

```bash
npm run build
```

The build process:
1. Generates Prisma client
2. Builds SvelteKit app with Vite
3. Optimizes for Vercel Edge Functions

## Troubleshooting

### Supabase Won't Start
- Ensure Docker Desktop is running
- Check port availability (54321-54324, 54322)
- Try `supabase stop` then `supabase start`

### Database Connection Issues
- Verify `.env` has correct connection string
- Check Supabase is running: `supabase status`
- Default local credentials: `postgres:postgres`

### Prisma Client Errors
```bash
# Regenerate Prisma client
npx prisma generate

# Reset if schema is out of sync
npx prisma db push --force-reset
```

### Port Already in Use
```bash
# Stop Supabase and other services
supabase stop

# Or change ports in supabase/config.toml
```

## Additional Resources

- [Prisma with Supabase Guide](https://supabase.com/partners/integrations/prisma)
- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Lucia Auth with Steam](https://discord.com/channels/1004048134218981416/1119986172383469569)

## Contributing

See `CLAUDE.md` for detailed development guidelines and conventions.

## Thanks

- @pilcrow on the Lucia Discord
- @khromov on the Svelte Discord
- The SvelteKit and Supabase communities