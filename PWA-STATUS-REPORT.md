# Focus Bro PWA Status Report

**Status date:** 2026-11-12  
**Production site:** <https://focus-bro.pages.dev>

## Summary

Focus Bro is a browser-based learning PWA hosted as static assets on Cloudflare
Pages. It uses Supabase Auth for accounts and stores each user's learning state
in the `focus_bro_state` table for cross-browser synchronization.

## Architecture

- `pages/`: HTML page entrypoints.
- `src/app/`: application TypeScript.
- `src/auth/`: Supabase authentication and session handling.
- `src/storage/`: browser persistence and synchronization.
- `assets/`: shared navigation, CSS, and images.
- `public/`: manifest and service worker.
- `supabase-schema.sql`: base database schema.

The architecture is described in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Available pages

- `/pages/dashboard`
- `/pages/focus-room`
- `/pages/timetable`
- `/pages/tasks`
- `/pages/analytics`
- `/pages/profile`

The application uses extensionless clean routes and keeps page entrypoints under
`pages/`.

## Authentication and account sync

The browser authenticates through Supabase Auth using
[`src/auth/auth.js`](src/auth/auth.js). The authenticated user's cloud state is
stored in `public.focus_bro_state`, protected by row-level security.

The application:

1. Restores a local/session cache for fast startup.
2. Restores or establishes the Supabase session.
3. Loads the authenticated user's cloud state.
4. Applies local changes to the account record.
5. Debounces saves and flushes pending changes when the page is hidden or closed.

The local cache is an offline recovery copy, not a separate account. Using the
same account on another browser or device is required to share data.

## Service-worker behavior

[`public/service-worker.js`](public/service-worker.js) uses cache version
`focus-bro-shell-v22`.

- Core clean routes and shared assets are precached.
- Navigation uses network-first behavior.
- Offline navigation falls back to cached pages or the dashboard.
- Old caches are removed during activation.
- The worker activates immediately and claims clients.
- Profile contains the manual **Update app** recovery control.
- Automatic update popups are disabled.

## Stored learning data

The shared state document contains feature records such as:

- Tasks: `focusbro.timetable.tasks.v1`
- Timetable: `focusbro.unified.timetable.v2`
- Lesson videos and notes: `lockin.v1`
- Self-taught goals: `lockin.selftaught.v2`
- Game and XP: `focusbro.game.v1`
- Study sessions: `focusbro.study.sessions.v1`
- Flashcards: `focusbro.flashcards.v1`
- Techniques: `focusbro.techniques.v1`

## Deployment verification

The following public routes were checked on 2026-11-12 and returned HTTP 200:

- `/`
- `/pages/dashboard`
- `/pages/profile`
- `/pages/tasks`
- `/pages/timetable`
- `/pages/analytics`

The deployment is static Cloudflare Pages content configured by the root
[`wrangler.toml`](wrangler.toml).

## Current maintenance notes

- Serve the project over HTTP(S); opening pages with `file:` disables service
  workers and browser APIs.
- Keep internal links on clean routes.
- Increment the service-worker cache/version identifiers when changing cached
  application assets.
- Apply [`supabase-schema.sql`](supabase-schema.sql) before enabling account
  sync in a new Supabase project.
- Never commit Supabase access tokens or service-role credentials.

