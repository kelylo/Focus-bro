# Focus Bro MCP server

The MCP entrypoint is [`src/index.js`](./src/index.js). It uses the authenticated
user's Supabase access token and exposes only that user's row through the
existing RLS policies.

Run it from this directory with `npm start`, or use the root compatibility
command `npm run mcp`.
