# Focus Bro — Complete PWA Description

**Status date:** 2026-11-12  
**Production site:** <https://focus-bro.pages.dev>

## 1. What the app is

Focus Bro is a browser-based learning system delivered as a static Progressive
Web App (PWA). It combines a learning dashboard, focus room, timetable, task
planning, progress analytics, profile/account management, offline recovery, and
account-wide synchronization.

The production frontend is hosted on Cloudflare Pages. Supabase provides
authentication and the account database. There is no application server in the
repository: browser pages call Supabase directly using the public project URL
and publishable key.

## 2. Repository structure

- [`index.html`](index.html): root loading/redirect surface.
- [`pages/`](pages/): the six application page entrypoints.
- [`assets/css/`](assets/css/): shared global and authentication styles.
- [`assets/js/navigation.js`](assets/js/navigation.js): shared sidebar,
  mobile navigation, account slot, and game-status display.
- [`assets/images/`](assets/images/): application branding.
- [`src/auth/auth.js`](src/auth/auth.js): authentication, local cache, cloud
  state loading, saving, profile changes, password changes, and game rewards.
- [`src/auth/auth-ui.js`](src/auth/auth-ui.js): sign-in, sign-up, recovery,
  account controls, and sync-status UI.
- [`src/config/supabase.js`](src/config/supabase.js): public Supabase URL and
  publishable browser key.
- [`src/storage/sync-engine.js`](src/storage/sync-engine.js): documented list
  of state keys that are synchronized.
- [`src/app/`](src/app/): TypeScript application/update scaffolding. The
  existing page shells still contain some feature-specific browser logic.
- [`public/manifest.json`](public/manifest.json): install metadata.
- [`public/service-worker.js`](public/service-worker.js): cache, offline
  fallback, activation, and update behavior.
- [`wrangler.toml`](wrangler.toml): Cloudflare static asset configuration.
- [`supabase-schema.sql`](supabase-schema.sql): database schema and RLS.
- [`docs/`](docs/): architecture, authentication, database, and deployment
  documentation.

## 3. User-facing pages and capabilities

### Dashboard

Route: `/pages/dashboard`

The dashboard is the main learning room. It provides the entry point to the
learning system, shared navigation, authentication state, and the user's
learning activity. It loads the shared account state before displaying
account-owned content.

### Focus Room

Route: `/pages/focus-room`

The focus room organizes video lessons, lesson notes, YouTube playback
checkpoints, focus minutes, self-taught goals, milestones, reasons, and atomic
habits. Lesson and goal data are stored in the synchronized account state.

### Timetable

Route: `/pages/timetable`

The timetable manages study days, classes, custom timetable entries, study
planning, revision/rest structure, and the learning-session experience. Its
state is synchronized through the timetable state keys.

### Tasks

Route: `/pages/tasks`

Tasks support planning the next action and tracking task completion. Task data
is stored under `focusbro.timetable.tasks.v1` and included in cloud sync.

### Analytics

Route: `/pages/analytics`

Analytics presents learning signals derived from stored study sessions,
completed work, focus activity, progress, and game/XP records.

### Profile

Route: `/pages/profile`

Profile manages the signed-in account, profile details, password changes,
sign-out, sync status, and the manual **Update app** recovery action. The
profile page is also the primary place to confirm whether account data is
pending, saving, synced, or failed.

## 4. Authentication

Supabase Auth handles email/password sign-in, registration, recovery links,
session restoration, token refresh, profile updates, password updates, and
sign-out.

The browser stores the current session in session storage and keeps a short-lived
per-user state cache in browser storage for fast startup/offline recovery. The
cache is not the account source of truth.

New-account access is restricted by the `focus_bro_allowed_users` table and the
`focus_bro_check_allowed_user` trigger. The owner must add an approved,
lower-case email before private registration can succeed.

## 5. Data and synchronization

The database table is `public.focus_bro_state`:

- `user_id`: primary key and reference to `auth.users`.
- `state`: JSON document containing the existing learning records.
- `updated_at`: last cloud-write timestamp.

Row-level security allows each authenticated user to select, insert, and update
only the row whose `user_id` equals `auth.uid()`.

The synchronization flow is:

1. Restore a recent per-user browser cache for fast rendering.
2. Restore or refresh the Supabase session.
3. Load the account row from Supabase.
4. Apply cloud state over the local startup copy.
5. Debounce edits and save them with an upsert.
6. Flush pending changes when the page is hidden or unloaded.
7. Keep failed writes locally and retry after a later change.

Signing in with the same account on another browser or device loads the same
cloud state.

## 6. Stored feature records

The synchronized JSON document currently supports these records:

- `lockin.v1`: lessons, YouTube checkpoints, notes, and focus minutes.
- `lockin.selftaught.v1` and `lockin.selftaught.v2`: goals, milestones,
  reasons, and habits.
- `focusbro.feynman.v1` and `focusbro.feynman.v2`: retained learning-reflection
  records from earlier releases.
- `focusbro.feynman.game.v3`: retained game-related compatibility data.
- `focusbro.mindmap.v1`: retained timetable/custom-entry compatibility data.
- `focusbro.timetable.v1` and `focusbro.unified.timetable.v2`: timetable data.
- `focusbro.timetable.tasks.v1`: tasks.
- `focusbro.techniques.v1`: study-practice completion.
- `focusbro.game.v1`: XP and idempotent reward records.

Older keys are retained to avoid destructive data loss even when an older page
or feature is no longer a current navigation destination.

## 7. PWA and offline behavior

The manifest installs the app with the name **Focus Bro - Learning Room**,
fullscreen display, the yellow theme color, and `/pages/dashboard` as the start
route.

The service worker:

- precaches the core clean routes and shared assets;
- uses network-first navigation when online;
- falls back to cached pages/dashboard when offline;
- activates new workers immediately;
- claims existing clients;
- removes old shell caches during activation;
- uses shell cache `focus-bro-shell-v23`;
- does not show automatic update popups.

The registration query and root worker import are also versioned as `v23`.
Users can apply a pending release from Profile → **Update app**.

## 8. Routing and hosting

The canonical routes are extensionless:

- `/pages/dashboard`
- `/pages/focus-room`
- `/pages/timetable`
- `/pages/tasks`
- `/pages/analytics`
- `/pages/profile`

Cloudflare Pages serves the repository as static assets through the root
[`wrangler.toml`](wrangler.toml). The app must be opened over HTTP(S); opening
HTML directly with `file:` disables service workers and related browser APIs.

## 9. Security boundaries

- Only the public Supabase project URL and publishable key are in frontend
  code.
- Service-role credentials must never be placed in the repository or browser.
- Supabase RLS is the database enforcement boundary for account isolation.
- The browser sends the signed-in user's access token for protected requests.
- Account data is kept in one user-owned row rather than exposed through a
  separate public data API.

## 10. Deployment and maintenance

The normal release flow is:

1. Change page or shared asset files.
2. Update service-worker version identifiers when cached assets change.
3. Run the available build/type checks when Node/npm is available.
4. Verify clean routes over HTTPS.
5. Commit and push to the configured GitHub branch.
6. Wait for Cloudflare Pages to publish the new commit.

Supabase setup requires running [`supabase-schema.sql`](supabase-schema.sql),
adding the permitted owner email, and configuring the deployed URL and recovery
redirects in Supabase Auth.

## 11. Current verified state

The following production routes returned HTTP 200 during the latest check:

- `/`
- `/pages/dashboard`
- `/pages/profile`
- `/pages/tasks`
- `/pages/timetable`
- `/pages/analytics`

The repository currently has no current application page or navigation entry
for abandoned integrations; the app surface described above is the maintained
PWA.

