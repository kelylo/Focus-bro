# Deployment

The site remains deployable as a static Cloudflare asset directory through
[`wrangler.toml`](../wrangler.toml). Use an HTTP(S) origin; `file:` URLs disable
service-worker behavior. The root `service-worker.js` is a compatibility
loader; the implementation lives in `public/service-worker.js`.

For a release, update the service-worker query version in
`assets/js/navigation.js`, `src/app/updates.ts`, and the root
`service-worker.js` import, then update the cache name in
`public/service-worker.js`. Commit and push. The app uses clean routes such as
`/pages/dashboard`; the Profile **Update app** control clears stale workers
and caches for recovery. There is no automatic update popup.

## MCP Worker

The MCP Worker is independently deployed from `mcp-server/` with its own
`wrangler.toml`. Configure the Supabase project URL and publishable key as
Worker variables. Never put a Supabase service-role key in the Worker bundle.
The bearer-token passthrough is for development verification only; production
external AI connections require the OAuth implementation and all security
verification gates documented in [`MCP-SECURITY.md`](../MCP-SECURITY.md).
