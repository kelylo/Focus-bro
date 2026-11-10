# Focus Bro architecture

Focus Bro uses the new directory layout. Application pages are kept only under
`pages/`; there are no duplicate page files at the repository root.

## Target boundaries

- `pages/`: the only page entrypoints.
- `assets/`: shared CSS, browser compatibility assets, and images.
- `src/app/`: TypeScript browser application logic.
- `src/auth/`: authentication and session behavior.
- `src/services/`: feature data access.
- `src/storage/`: browser persistence and account synchronization contracts.
- `public/`: deployment assets such as the manifest and service worker.
- `mcp-server/`: the separate Claude/ChatGPT MCP process.
- `supabase/`: database migrations and seed data.

The canonical pages load shared auth from `src/auth/` and shared styles from
`assets/css/`. New browser behavior belongs in `src/app/*.ts`. The TypeScript
entrypoint is `src/app/main.ts`; `npm run build` emits its JavaScript under
`dist/app/`. The existing page shells continue to use the stable compatibility
navigation while the generated bundle is introduced page by page.
