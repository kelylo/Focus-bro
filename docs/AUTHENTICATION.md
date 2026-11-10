# Authentication and sync

The browser signs in through Supabase and receives a user-scoped access token.
`focus-bro-auth.js` restores cached state immediately, then replaces it with
the account row from Supabase. Writes are debounced and flushed when the page
is hidden or unloaded.

To see the same data on another browser or platform:

1. Sign in with the same account.
2. Ensure the Supabase schema has been applied.
3. Wait for the sync status to report saved/synced.

The local cache is an offline safety copy, not a separate account. MCP uses a
user access token and the same RLS-protected row.
