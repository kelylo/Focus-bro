# Focus Bro architecture

Focus Bro is currently an incremental static-site migration. Existing root
HTML URLs remain the production entrypoints so bookmarks and the deployed
Cloudflare Pages asset paths do not break.

## Target boundaries

- `pages/`: page entrypoints migrated from the root one at a time.
- `assets/`: shared CSS, browser navigation, components, and images.
- `src/auth/`: authentication and session behavior.
- `src/services/`: feature data access.
- `src/storage/`: browser persistence and account synchronization contracts.
- `public/`: deployment assets such as the manifest and service worker.
- `mcp-server/`: the separate Claude/ChatGPT MCP process.
- `supabase/`: database migrations and seed data.

Until a page is migrated, it must continue using `FocusBroAuth` and
`FocusBroStore`; those APIs are the compatibility boundary for cloud sync.
