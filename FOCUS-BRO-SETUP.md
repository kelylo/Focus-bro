# Focus Bro setup

Focus Bro is a static PWA. Supabase is the source of truth for authenticated learning state; the browser cache is only a startup/offline safety copy.

## Supabase setup

1. Open the SQL editor for the project configured in `supabase-config.js`.
2. Run `supabase-schema.sql`.
3. Before enabling private registration, add the owner's lower-case email to the allowlist:

```sql
insert into public.focus_bro_allowed_users (email)
values ('your-email@example.com')
on conflict (email) do nothing;
```

4. In Authentication settings, keep email/password enabled, configure the Site URL and redirect URLs for the deployed app, and enable email confirmation if desired.
5. Add the deployed app URL to the password-reset redirect allowlist. The UI uses Supabase's `/auth/v1/recover` endpoint.

The application expects `public.focus_bro_state` to exist. If the app shows `Sync failed` and the browser network request to `/rest/v1/focus_bro_state` returns `404`, the SQL migration has not been run in this Supabase project. Do not keep editing data in multiple browsers until the migration is applied.

The frontend contains only the public project URL and publishable key. Never put a service-role key in this repository. `focus_bro_state` is protected by RLS, and the allowlist trigger rejects new accounts not explicitly approved by the owner.

## Persistence model

All existing feature records remain inside the `focus_bro_state.state` JSON document to preserve existing data and avoid a destructive migration. The store keys are:

- `lockin.v1`: lessons, YouTube checkpoints, notes, and focus minutes
- `lockin.selftaught.v2`: goal, milestone, reason, and habits
- `focusbro.feynman.v2`: Feynman reflection
- `focusbro.mindmap.v1`: timetable custom entries from older releases
- `focusbro.unified.timetable.v2`: timetable days and classes
- `focusbro.timetable.tasks.v1`: tasks
- `focusbro.techniques.v1`: study practice completion
- `focusbro.game.v1`: XP and idempotent reward records

Writes are debounced briefly, cached per user, and flushed when the page is hidden or navigated away from. The account UI reports pending, saving, synced, and failed states. A failed request remains in the local per-user cache and is retried on the next change or session.

## App updates

The service worker keeps the app available offline and checks for a newer release when a page opens. When an update is ready, an **Update available** prompt appears on desktop and mobile. Choose **Update now** to activate the new version and reload the current page; this avoids needing a browser-specific hard-refresh gesture.

## Backup and migration

Before schema changes, export the `focus_bro_state` table from Supabase or run:

```sql
select user_id, state, updated_at from public.focus_bro_state;
```

The current release does not delete or reshape existing state. Older keys are retained and included in the shared sync allowlist.

If Chrome has data while another browser does not, sign in to Chrome, open Profile, choose **Export backup**, apply the SQL migration, sign in to the same account in the target browser, and choose **Import backup** there. Import refuses to overwrite a non-empty cloud row. Repeat imports are therefore safe and do not create duplicate records because the state is keyed by the authenticated user's UUID.

## Verification checklist

Run the app from a web server, sign in, and verify:

- Add a lesson and timestamped note, open Timetable, then return to Focus Room.
- Edit a task and timetable entry, refresh, and verify both return.
- Sign out and verify saving a lesson asks for authentication.
- Use Forgot password and confirm Supabase sends the recovery email.
- Open the same account in another browser and verify the cloud state appears.
- Block the network, make an edit, confirm the UI shows pending/error, then reconnect and make another edit to retry.
- Start YouTube playback, leave the page, and verify the checkpoint returns.

The repository is a static site with no package build step. Use a local HTTP server or the configured Cloudflare deployment; opening pages with `file:` disables service-worker behavior and can prevent embedded YouTube origin behavior.
