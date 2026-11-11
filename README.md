# Focus Bro

Focus Bro is a TypeScript-first learning PWA backed by Supabase account sync.
The browser still needs a minimal HTML document as its loading surface, but
application behavior belongs in TypeScript under `src/` and is compiled to
`dist/`.

## Run locally

Serve the repository over HTTP(S); do not open pages with `file:` because
service workers and some browser APIs require an origin:

```powershell
npx serve .
```

Open `pages/dashboard`. Cloudflare Pages uses clean URLs; do not bookmark the
old `.html` paths. There are no duplicate page files at the repository root;
all application pages live in `pages/`.

Build the TypeScript source with `npm run build`. The generated JavaScript is
written to `dist/` and should not be edited by hand.

## Architecture

- `pages/`: the only application page entrypoints.
- `src/app/`: TypeScript browser application logic.
- `assets/`: shared CSS, navigation, and images.
- `src/auth/` and `src/config/`: Supabase authentication/configuration.
- `src/storage/`: account-sync storage contract.
- `public/`: manifest and service-worker implementation.
- `mcp-server/`: local MCP server for the authenticated account.
- `docs/`: architecture, database, authentication, and deployment notes.

## MCP connections

See [`MCP-SETUP.md`](./MCP-SETUP.md), [`CHATGPT-CONNECTION.md`](./CHATGPT-CONNECTION.md),
[`CLAUDE-CONNECTION.md`](./CLAUDE-CONNECTION.md), and
[`MCP-TROUBLESHOOTING.md`](./MCP-TROUBLESHOOTING.md). The remote Worker
currently publishes diagnostics but its OAuth authorization/token endpoints
remain disabled; do not advertise it as connected until those endpoints and
the production verification gates are complete.

Never commit Supabase access tokens or service-role keys.
