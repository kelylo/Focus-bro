# Focus Bro MCP

`mcp-server.js` is a dependency-free MCP server for the authenticated Focus Bro account. It uses the Supabase access token supplied at launch, so it can only read or write that user’s row protected by Supabase RLS.

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
      "args": ["D:\\PY\\mcp-server.js"],
      "env": {
        "FOCUS_BRO_SUPABASE_URL": "https://your-project.supabase.co",
        "FOCUS_BRO_SUPABASE_PUBLISHABLE_KEY": "your-publishable-key",
        "FOCUS_BRO_SUPABASE_ACCESS_TOKEN": "your-access-token"
      }
    }
  }
}
```

## ChatGPT

The local stdio server can be used with the OpenAI Responses API through OpenAI’s Secure MCP Tunnel. A public HTTPS deployment must use an authenticated remote MCP endpoint; do not expose this local server or put a service-role key in the browser or repository.

The available tools are `get_focus_bro_state` and `save_focus_bro_state`. The web app itself already syncs the same account state through `focus_bro_state`, so changes made through MCP become available to every signed-in browser after its next sync.
