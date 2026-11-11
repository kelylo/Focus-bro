# Focus Bro MCP

`mcp-server/src/worker.ts` is the independently deployable Cloudflare Worker
MCP server. `mcp-server/src/index.js` remains a local stdio compatibility
server. The Worker currently supports authenticated development calls and discovery
diagnostics only. Do not expose it to ChatGPT or Claude until the OAuth 2.1 +
PKCE flow is implemented and the production verification gates pass.

## Configure

Set these environment variables without committing them:

```powershell
$env:FOCUS_BRO_SUPABASE_URL = "https://your-project.supabase.co"
$env:FOCUS_BRO_SUPABASE_PUBLISHABLE_KEY = "your-publishable-key"
$env:FOCUS_BRO_SUPABASE_ACCESS_TOKEN = "the-user-access-token"
```

The access token is the signed-in user’s Supabase `access_token`, not a service-role key. Tokens expire; obtain a fresh one when the client reports an authentication error.

## Claude Desktop

Add a server entry to Claude Desktop’s MCP configuration:

```json
{
  "mcpServers": {
    "focus-bro": {
      "command": "node",
      "args": ["D:\\PY\\mcp-server\\src\\index.js"],
      "env": {
        "FOCUS_BRO_SUPABASE_URL": "https://your-project.supabase.co",
        "FOCUS_BRO_SUPABASE_PUBLISHABLE_KEY": "your-publishable-key",
        "FOCUS_BRO_SUPABASE_ACCESS_TOKEN": "your-access-token"
      }
    }
  }
}
```

Restart Claude Desktop after saving the configuration. Open the connector/tool
list and confirm `get_focus_bro_state` is available. The configured token is
for one Focus Bro account; use a refreshed token when it expires.

## ChatGPT

ChatGPT web custom connectors require a publicly reachable HTTPS MCP endpoint.
This local stdio server can be used with the OpenAI Responses API through
OpenAI's Secure MCP Tunnel. It is not safe to expose the local process directly
to the internet.

For the OpenAI API, configure the MCP tool with the remote tunnel URL:

```javascript
const response = await client.responses.create({
  model: "gpt-5",
  tools: [{
    type: "mcp",
    server_label: "focus-bro",
    server_url: "https://your-secure-mcp-endpoint.example/mcp",
    require_approval: { always: {} }
  }],
  input: "Summarize my Focus Bro progress."
});
```

For ChatGPT's connector UI, deploy an authenticated HTTP version of this
server (with OAuth or an organization-managed static credential), then add its
HTTPS `/mcp` URL under Settings > Connectors. Do not put a Supabase
service-role key in that deployment.

The available tools include read-only overview, task, timetable, subject,
progress, note, video, saved-resource, deadline, weekly-report, and
neglected-subject tools, plus `get_focus_bro_state`. The legacy
`save_focus_bro_state` tool is retained as a disabled compatibility response.
Narrow write tools are present but fail closed
unless the Worker environment has `MCP_ENABLE_WRITE_TOOLS=true` after OAuth
grant scope enforcement is deployed. The
Worker now publishes MCP OAuth discovery metadata, but `/oauth/*` intentionally
returns a safe `501` until grant storage, consent, PKCE verification, and
token rotation are deployed. Do not connect a provider to this development
endpoint yet. The web app itself already syncs the same account state through
`focus_bro_state`, so changes made through MCP become available to every
signed-in browser after its next sync.

The AI Connect dashboard shows only grants belonging to the current signed-in
user. Revoking a grant updates that user’s `mcp_grants` row through Supabase
RLS. Tool activity remains unavailable until the Worker records redacted audit
events.

Phase 8 diagnostics use the separately deployed Worker URL. Save an HTTPS URL
ending in `/mcp`, then test health and OAuth discovery from AI Connect. A
successful discovery test is not a provider connection: `/oauth/authorize` and
`/oauth/token` must be implemented before ChatGPT or Claude can authenticate.
