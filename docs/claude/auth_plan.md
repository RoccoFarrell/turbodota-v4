# Authentication System Refactor Plan

## Context

The current authentication system uses **Lucia v2** (deprecated) with Steam OpenID as the primary login method. The Dota 2 account ID is derived from the user's Steam ID and stored directly on the User model. This creates a tight coupling between authentication identity and game identity.

**Goals of this refactor:**
1. Replace Lucia v2 with a modern auth stack supporting both Google and Steam login
2. Decouple Dota 2 account tracking from user authentication (per-save account_id selection)
3. Allow any authenticated user to track any Dota 2 account ID
4. Clean break for existing users (no migration path needed)

## Key Decisions Made

### Auth Stack
- **Google OAuth**: Arctic library for OAuth 2.0 flow
- **Steam OpenID**: Keep `node-steam-openid` (works, protocol is frozen, minimal risk)
- **Session Management**: Custom implementation (~50 lines) replacing Lucia's session/key tables

### Dota Account ID Handling
- **Per-save selection**: Each IncrementalSave has its own `account_id` field
- **User choice**: Users can track any Dota 2 account ID, not required to prove ownership
- **Onboarding**: Prompt user to set account_id per save (auto-fill from Steam if they used Steam login)

### Migration Strategy
- **Clean break**: No migration for existing Steam users
- Old data remains in DB but is not accessible after refactor
- Users re-register with Google or Steam and start fresh

## Current State Analysis

### Files Using Lucia Auth (to be updated)
- `src/lib/server/lucia.ts` - Lucia configuration
- `src/hooks.server.ts` - Sets `event.locals.auth`
- `src/app.d.ts` - Lucia type definitions
- `src/routes/api/auth/steam/+server.ts` - Steam login initiation
- `src/routes/api/auth/steam/authenticate/+server.ts` - Steam callback
- `src/routes/admin/login/+page.server.ts` - Admin username/password login
- `src/routes/admin/register/+page.server.ts` - Admin registration
- `src/routes/logout/+server.ts` - Logout handler
- `src/routes/+layout.server.ts` - Root layout session validation
- `src/routes/_components/Navigation/Navigation.svelte` - Login/logout UI

### Files Using User.account_id (to be updated)
- `src/lib/server/incremental-save.ts` - `resolveIncrementalSave()` uses userId
- `src/routes/api/incremental/roster/convert-win/+server.ts` - Uses `session.user.account_id`
- `src/routes/api/incremental/roster/eligible-wins/+server.ts` - Uses `session.user.account_id`
- `src/lib/incremental/quests/quest-progress.server.ts` - Takes accountId parameter
- `src/lib/incremental/bank/grant-runes.server.ts` - Resolves accountId → User → save
- `src/routes/incremental/+layout.server.ts` - Passes `accountId` to client
- All quest-related API routes under `src/routes/api/incremental/quests/`

### Prisma Schema Changes Needed
**User model:**
- Remove `account_id` (Int, unique) - moves to IncrementalSave
- Remove `dota_user` relation (was linked via account_id)
- Add `email` (String, unique, nullable) for Google auth
- Replace `key` → remove Key model entirely
- Replace `auth_session` → new UserSession model

**New UserSession model:**
```prisma
model UserSession {
  id        String   @id @default(cuid())
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}
```

**IncrementalSave model:**
- Add `account_id` (Int, nullable) - Dota 2 account ID for this save
- Add index on `account_id`

**Remove:**
- `Key` model (Lucia-specific)
- Old `Session` model (replace with UserSession)

**UserPrefs model:**
- Change `account_id` → `userId` reference

## Implementation Steps

### Phase 1: Database Schema & Migration
1. Update `prisma/schema.prisma`:
   - Modify User model (add email, remove account_id/dota_user, update relations)
   - Create UserSession model
   - Remove Key model
   - Remove old Session model
   - Add account_id to IncrementalSave
   - Update UserPrefs to use userId

2. Create migration:
   ```bash
   npx prisma migrate dev --name refactor_auth_google_steam_per_save_account
   ```

3. Run `npx prisma generate` to update Prisma client

### Phase 2: Custom Session Management
Create `src/lib/server/session.ts`:
- `createSession(userId: string): Promise<{ sessionId, expiresAt }>` - Create session in DB
- `validateSessionId(sessionId: string): Promise<{ user, session } | null>` - Check if valid & not expired
- `invalidateSession(sessionId: string): Promise<void>` - Delete session
- `setSessionCookie(cookies, sessionId, expiresAt)` - Set HTTP-only cookie
- `clearSessionCookie(cookies)` - Clear cookie
- Session duration: 30 days

### Phase 3: Google OAuth with Arctic
1. Install Arctic: `npm install arctic`
2. Add env vars to `.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```
3. Create `src/lib/server/arctic.ts` - Arctic Google provider config
4. Create routes:
   - `src/routes/api/auth/google/+server.ts` - Initiate OAuth (redirect to Google)
   - `src/routes/api/auth/google/callback/+server.ts` - Handle callback:
     - Exchange code for tokens
     - Fetch user info (email, name, avatar)
     - Find or create User by email
     - Create session
     - Redirect to `/incremental` or onboarding

### Phase 4: Refactor Steam Auth
Update `src/routes/api/auth/steam/authenticate/+server.ts`:
- Keep `node-steam-openid` flow as-is
- Remove Lucia's `auth.createUser()` and `auth.createSession()`
- Find or create User by `steam_id`
- Use new `createSession()` from session.ts
- Set session cookie
- Redirect to `/incremental` or onboarding

### Phase 5: Update hooks.server.ts
Replace Lucia's `auth.handleRequest()`:
```typescript
export const handle: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get('session_id')
  if (sessionId) {
    const result = await validateSessionId(sessionId)
    if (result) {
      event.locals.user = result.user
      event.locals.session = result.session
    }
  }
  return await resolve(event)
}
```

Update `src/app.d.ts`:
```typescript
declare namespace App {
  interface Locals {
    user: User | null
    session: UserSession | null
  }
}
```

### Phase 6: Dota Account ID Selection UI
1. Create `src/routes/incremental/onboarding/+page.svelte`:
   - Form to enter Dota 2 account ID
   - Auto-fill from Steam ID if available (calculate from `user.steam_id`)
   - Validation: must be a positive integer
   - POST to `/api/incremental/saves/set-account-id`

2. Create settings page to change account_id later:
   - `src/routes/incremental/settings/+page.svelte`
   - Update account_id for current save

3. Update `src/routes/incremental/+layout.server.ts`:
   - If user has no saves or current save has no account_id → redirect to onboarding
   - Pass save's account_id to client (not user's)

### Phase 7: Update IncrementalSave Logic
Modify `src/lib/server/incremental-save.ts`:
- `resolveIncrementalSave()` returns `{ saveId, userId, account_id }` (from save, not user)
- API routes read account_id from resolved save, not session.user

Update all match-related incremental APIs:
- `src/routes/api/incremental/roster/convert-win/+server.ts`
- `src/routes/api/incremental/roster/eligible-wins/+server.ts`
- `src/routes/api/incremental/quests/matches/+server.ts`
- `src/routes/api/incremental/quests/progress/+server.ts`
- `src/lib/incremental/bank/grant-runes.server.ts`

Change from:
```typescript
const accountId = session.user.account_id
```

To:
```typescript
const { account_id } = await resolveIncrementalSave(event, { saveId })
if (!account_id) {
  error(400, 'No Dota account set for this save')
}
```

### Phase 8: Update All Auth References
**Root layout:**
- `src/routes/+layout.server.ts` - Use `locals.user` instead of `locals.auth.validate()`

**Navigation:**
- `src/routes/_components/Navigation/Navigation.svelte` - Update session checks

**Logout:**
- `src/routes/logout/+server.ts` - Use `invalidateSession()` + `clearSessionCookie()`

**API routes pattern (all incremental, turbotown, cards, etc.):**
```typescript
// Old
const session = await locals.auth.validate()
if (!session) error(401, 'Unauthorized')

// New
if (!locals.user) error(401, 'Unauthorized')
const userId = locals.user.id
```

**Feature layouts:**
- `src/routes/dotadeck/+layout.server.ts`
- `src/routes/turbotown/+layout.server.ts`
- `src/routes/leagues/+layout.server.ts`

### Phase 9: Remove Lucia & Cleanup
1. Uninstall packages:
   ```bash
   npm uninstall lucia @lucia-auth/adapter-prisma
   ```

2. Delete files:
   - `src/lib/server/lucia.ts`
   - `src/routes/admin/login/` (entire directory)
   - `src/routes/admin/register/` (entire directory)
   - `src/routes/admin/logout/+server.ts`
   - Remove admin links from Navigation component

3. Update `src/routes/api/helpers.ts`:
   - Remove `createDotaUser()` if no longer needed (or keep if used elsewhere)

### Phase 10: Testing
**Manual testing checklist:**
- [ ] Google login flow (new user)
- [ ] Google login flow (returning user)
- [ ] Steam login flow (new user)
- [ ] Steam login flow (returning user)
- [ ] Dota account ID onboarding (manual entry)
- [ ] Dota account ID onboarding (auto-fill from Steam)
- [ ] Session persistence across page loads
- [ ] Session expiration after 30 days
- [ ] Logout flow
- [ ] Incremental game: roster recruitment (uses account_id)
- [ ] Incremental game: quest progress (uses account_id)
- [ ] Incremental game: arcane rune grants (uses account_id)
- [ ] Incremental game: save switching (different account_ids)

**Edge cases:**
- User with no saves → create one during onboarding
- User with saves but no account_id set → redirect to onboarding
- Changing account_id mid-game → verify match data updates
- Multiple saves with different account_ids

## Critical Files Reference

### To Create:
- `src/lib/server/session.ts` - Custom session management
- `src/lib/server/arctic.ts` - Arctic Google provider
- `src/routes/api/auth/google/+server.ts` - Google OAuth initiate
- `src/routes/api/auth/google/callback/+server.ts` - Google OAuth callback
- `src/routes/incremental/onboarding/+page.svelte` - Dota ID selection
- `src/routes/incremental/settings/+page.svelte` - Change account_id
- `src/routes/api/incremental/saves/set-account-id/+server.ts` - API to update save account_id

### To Modify (high priority):
- `prisma/schema.prisma` - Schema changes
- `src/hooks.server.ts` - Session validation
- `src/app.d.ts` - Type definitions
- `src/lib/server/incremental-save.ts` - Save resolution with account_id
- `src/routes/api/auth/steam/authenticate/+server.ts` - Use custom sessions
- `src/routes/+layout.server.ts` - Session loading
- `src/routes/_components/Navigation/Navigation.svelte` - UI updates
- `src/routes/logout/+server.ts` - Custom session invalidation
- All incremental API routes (30+ files) - Replace `locals.auth.validate()`

### To Delete:
- `src/lib/server/lucia.ts`
- `src/routes/admin/login/+page.server.ts`
- `src/routes/admin/login/+page.svelte`
- `src/routes/admin/register/+page.server.ts`
- `src/routes/admin/register/+page.svelte`
- `src/routes/admin/logout/+server.ts`

## Risk Mitigation

**Data loss prevention:**
- Clean break approach means no risk of corrupting existing data
- Old tables (User, Session, Key) can remain for reference
- Incremental game saves tied to old users won't be accessible but won't be deleted

**Rollback plan:**
- Keep migration file
- Can revert with `npx prisma migrate rollback` if issues arise
- Keep old code in git history

**Testing strategy:**
- Test auth flows in dev environment first
- Verify session cookies work across requests
- Test incremental game with per-save account_id before deploying

## Environment Variables Needed

Add to `.env` and Vercel:
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Get from: https://console.cloud.google.com/apis/credentials

Authorized redirect URIs:
- Dev: `http://localhost:5173/api/auth/google/callback`
- Prod: `https://turbodota.com/api/auth/google/callback`

## Deployment Checklist

Before deploying:
- [ ] Run migration in dev successfully
- [ ] Test all auth flows locally
- [ ] Test incremental game functionality
- [ ] Add Google OAuth credentials to Vercel env vars
- [ ] Update CORS/allowed origins if needed
- [ ] Verify session cookie settings for production domain
- [ ] Test logout flow
- [ ] Verify no references to `locals.auth` remain

After deploying:
- [ ] Test Google login in production
- [ ] Test Steam login in production
- [ ] Verify session persistence
- [ ] Monitor error logs for auth issues

## Notes

- Arctic supports PKCE out of the box for enhanced security
- Session cookies should be HTTP-only, Secure (in prod), SameSite=Lax
- Consider adding CSRF protection for sensitive actions
- Google refresh tokens not needed since sessions are long-lived (30 days)
- Steam OpenID doesn't provide email, so email field is nullable
- Users who log in with both Google and Steam will create separate accounts (no account linking)
