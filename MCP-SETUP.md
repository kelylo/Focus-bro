# Focus Bro MCP

`mcp-server/src/index.js` is a dependency-free MCP server for the authenticated Focus Bro account. The root `mcp-server.js` remains a compatibility launcher. It uses the Supabase access token supplied at launch, so it can only read or write that user’s row protected by Supabase RLS.

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

The available tools are `get_focus_bro_state` and `save_focus_bro_state`. The web app itself already syncs the same account state through `focus_bro_state`, so changes made through MCP become available to every signed-in browser after its next sync.
