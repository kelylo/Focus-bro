# Focus Bro MCP server

The Worker entrypoint is [`src/worker.ts`](./src/worker.ts). It exposes
`/mcp` using the official MCP TypeScript SDK and Streamable HTTP. The existing
[`src/index.js`](./src/index.js) remains a local stdio compatibility server.

Phase 3 uses a caller-supplied Supabase bearer token so Supabase RLS binds
each request to its authenticated user. This is not the final public
integration: OAuth 2.1, PKCE, token rotation, discovery metadata, and consent
are Phase 4 requirements and must be completed before exposing the Worker to
ChatGPT or Claude.

The MCP entrypoint is [`src/index.js`](./src/index.js). It uses the authenticated
user's Supabase access token and exposes only that user's row through the
existing RLS policies.

Run the local server with `npm start`. For the Worker, install dependencies
and use `npm run typecheck`, `npm run dev`, or `npm run deploy`.
