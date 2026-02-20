# Unauthenticated Access Controls Design

## Problem
When unauthenticated, DotaDeck, Leagues, and Dark Rift features should not be fully accessible. Only "Enter the Rift" should be visible, leading to a placeholder page explaining the user needs to log in and link a Dota 2 account.

## Design

### Navigation Changes (`Navigation.svelte`)
- **"Enter the Rift"**: Always visible, links to `/incremental`
- **DotaDeck, Leagues**: Visible but greyed out when unauthenticated. Rendered as `<span>` instead of `<a>` with `opacity-50 cursor-not-allowed` styling and a lock icon. Subtitle: "Login required"
- **Dark Rift sub-items** (Dashboard, Scavenging, Barracks, etc.): Hidden when unauthenticated. Only "Enter the Rift" shown in that section.

### Auth Guard (`/incremental/+layout.server.ts`)
- When `!locals.user?.account_id`, redirect 302 to `/incremental/welcome`
- The `/incremental/welcome` route uses its own server load (or group layout) to avoid the redirect loop

### Placeholder Page (`/incremental/welcome/+page.svelte`)
- Dark-themed page matching existing aesthetic
- Atmospheric heading ("The Dark Rift Awaits")
- Subheading explaining login + Dota 2 account linking requirement
- Google + Steam login buttons (reuse existing auth components from homepage/header)
- Feature teaser section reusing the 8 feature cards from the homepage
- If authenticated but no Dota account linked: show "Link your Dota 2 account" messaging instead

### DotaDeck Guard Fix
- Change `/dotadeck/+page.server.ts` from returning 401 to `redirect(302, '/')` for consistency with other routes

## Decisions
- Dedicated `/incremental/welcome` route (not client-side conditional) for clean separation
- Server-side redirects over client-side guards for reliability
- Greyed-out nav items (not hidden) for DotaDeck/Leagues to hint at available content
