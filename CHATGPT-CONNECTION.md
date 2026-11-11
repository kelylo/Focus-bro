# ChatGPT connection validation

1. Deploy the independent `mcp-server` Worker to an HTTPS URL.
2. Open **Focus Bro → AI Connect** and save the Worker URL ending in `/mcp`.
3. Run **Test MCP endpoint**. Health and both discovery documents must be available.
4. Open ChatGPT connector settings from the ChatGPT card.
5. Add the saved `/mcp` URL when ChatGPT supports remote MCP OAuth for the account.
6. Sign in to Focus Bro in the authorization window and approve only the scopes you need.

The connection is not production-ready while `/oauth/authorize` and
`/oauth/token` return `501`. The diagnostics page intentionally reports this
as not ready; discovery metadata alone does not authenticate a provider.
