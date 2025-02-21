# Turbodota v4

The Sveltekit respository for [Turbodota.com: The Tracker for Turbo](https://www.turbodota.com)

This is the 4th iteration of our Turbo Dota tracking site:

- v1 - Vue and Firebase
- v2 - React and Firebase
- v3 - Sveltekit and no database

v4 Built using:

- [SvelteKit](https://kit.svelte.dev/)
- [Skeleton UI](https://www.skeleton.dev/)
- [Prisma](https://www.prisma.io/)
- [Supabase](https://supabase.com/)
- [Lucia Auth](https://lucia-auth.com/)
- [OpenDota API](https://docs.opendota.com/)

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`):

### Prisma

To migrate the schema to your local SQLite instance, use 

```bash
npm run prisma
```

Which runs:

```bash
npx prisma generate && npx prisma db push
```

### Dev Server

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

### Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your 
target environment.

### Testing

[Mock Service Workers](https://mswjs.io/)

- API testing https://www.usebruno.com/

- Mocking Prisma https://www.prisma.io/blog/testing-series-1-8eRB5p0Y8o

## Other Info

### OpenMoji
https://openmoji.org/

### Prisma

[Prisma connection pooling with Supabase](https://supabase.com/partners/integrations/prisma#connection-pooling-with-supabase)

### Lucia Auth with Steam

https://discord.com/channels/1004048134218981416/1119986172383469569

### Testing Sveltekit API routes
https://github.com/sveltejs/kit/issues/983#issuecomment-1091761702

### Form actions with hidden input fields
https://joyofcode.xyz/working-with-forms-in-sveltekit#working-with-forms-using-api-endpoints

## Thanks

- @pilcrow on the Lucia Discord
- @khromov on the Svelte Discord

## Database Setup

### Local Development

The project uses Supabase for both production and local development. To work with a local database:

1. Start the Supabase dev server:
   ```bash
   supabase start
   ```

2. Check server status and get connection details:
   ```bash
   supabase status
   ```

3. In `prisma/schema.prisma`, switch to the dev database:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DEV_URL") // Local development DB
   }

   // Production config (commented out during local dev)
   // datasource db {
   //   provider  = "postgresql"
   //   url       = env("DATABASE_URL")
   //   directUrl = env("DIRECT_URL")
   // }
   ```

4. Add local connection string to `.env`:
   ```env
   DEV_URL="postgresql://postgres:postgres@localhost:54322/postgres"
   ```

5. Push schema changes:
   ```bash
   npx prisma db push
   ```

### Switching Back to Production

1. Revert `schema.prisma` to use production config
2. Ensure `DATABASE_URL` and `DIRECT_URL` are set in your environment
3. Run `npx prisma generate` to update the client