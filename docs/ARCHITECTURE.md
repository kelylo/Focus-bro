# Focus Bro architecture

Focus Bro uses the new directory layout while preserving the original root
HTML URLs as compatibility redirects, so bookmarks and deployed Cloudflare
Pages paths do not break.

## Target boundaries

- `pages/`: canonical page entrypoints.
- `assets/`: shared CSS, browser navigation, components, and images.
- `src/auth/`: authentication and session behavior.
- `src/services/`: feature data access.
- `src/storage/`: browser persistence and account synchronization contracts.
- `public/`: deployment assets such as the manifest and service worker.
- `mcp-server/`: the separate Claude/ChatGPT MCP process.
- `supabase/`: database migrations and seed data.

The canonical pages load shared auth from `src/auth/`, shared navigation from
`assets/js/navigation.js`, and shared styles from `assets/css/`. Pages use
`FocusBroAuth` and `FocusBroStore` as the account-sync boundary.
