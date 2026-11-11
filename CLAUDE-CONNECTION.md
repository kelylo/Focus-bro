# Claude connection validation

1. Deploy the independent `mcp-server` Worker to an HTTPS URL.
2. Open **Focus Bro → AI Connect** and save the Worker URL ending in `/mcp`.
3. Run **Test MCP endpoint** and confirm health plus OAuth discovery succeed.
4. Open Claude connector settings from the Claude card.
5. Add the saved `/mcp` URL where remote MCP connectors are available.
6. Sign in to Focus Bro and approve the least-privilege scopes requested.

Do not paste a Supabase key, password, service-role key, or bearer token into
Claude. The connector cannot be considered connected while the Worker OAuth
authorization and token endpoints return `501`.
