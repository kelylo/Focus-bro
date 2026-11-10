# Deployment

The site remains deployable as a static Cloudflare asset directory through
[`wrangler.toml`](../wrangler.toml). Use an HTTP(S) origin; `file:` URLs disable
service-worker behavior.

For a release:

1. Update the service-worker query version in `focus-bro-nav.js` and
   `Focus-Bro.html`.
2. Update the cache name in `focus-bro-sw.js`.
3. Commit and push.
4. Open an existing page and confirm the pending-update prompt appears only
   when a waiting worker exists.

The update button activates the waiting worker and reloads the current page.
