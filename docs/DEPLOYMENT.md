# Deployment

The site remains deployable as a static Cloudflare asset directory through
[`wrangler.toml`](../wrangler.toml). Use an HTTP(S) origin; `file:` URLs disable
service-worker behavior. The root `service-worker.js` is a compatibility
loader; the implementation lives in `public/service-worker.js`.

For a release:

1. Update the service-worker query version in
   `assets/js/navigation.js` and `pages/dashboard.html`.
2. Update the cache name in `public/service-worker.js`.
3. Commit and push.
4. Open an existing page and confirm the pending-update prompt appears only
   when a waiting worker exists.

The update button activates the waiting worker and reloads the current page.

## MCP Worker

The MCP Worker is independently deployed from `mcp-server/` with its own
`wrangler.toml`. Configure the Supabase project URL and publishable key as
Worker variables. Never put a Supabase service-role key in the Worker bundle.
Phase 3's bearer-token passthrough is for development verification only;
production external AI connections require the Phase 4 OAuth implementation.
