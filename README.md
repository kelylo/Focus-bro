# Focus Bro

Focus Bro is a static learning PWA backed by Supabase account sync.

## Run locally

Serve the repository over HTTP(S); do not open pages with `file:` because
service workers and some browser APIs require an origin:

```powershell
npx serve .
```

Open `pages/dashboard.html`. The old root URLs such as `Focus-Bro` remain
redirects for bookmarks.

## Architecture

- `pages/`: canonical application pages.
- `assets/`: shared CSS, navigation, and images.
- `src/auth/` and `src/config/`: Supabase authentication/configuration.
- `src/storage/`: account-sync storage contract.
- `public/`: manifest and service-worker implementation.
- `mcp-server/`: local MCP server for the authenticated account.
- `docs/`: architecture, database, authentication, and deployment notes.

## MCP connections

See [`MCP-SETUP.md`](./MCP-SETUP.md). Claude Desktop can launch the local
stdio server directly. ChatGPT requires an authenticated HTTPS MCP endpoint or
OpenAI's Secure MCP Tunnel; the local process must not be exposed directly.

Never commit Supabase access tokens or service-role keys.
