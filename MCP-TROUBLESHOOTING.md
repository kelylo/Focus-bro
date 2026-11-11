# Focus Bro MCP troubleshooting

## The app still shows an old version

Open the clean Profile route:

```text
https://focus-bro.pages.dev/pages/profile
```

Click **Update app**. This clears registered service workers and browser
caches, then opens the current dashboard. If the installed home-screen icon
still opens an old page, remove that icon and add the clean dashboard again:

```text
https://focus-bro.pages.dev/pages/dashboard
```

Do not use old `.html` bookmarks such as `dashboard.html` or
`knowledge-lab.html`.

## Endpoint diagnostics fail

In **AI Connect**, save the public HTTPS Worker URL ending in `/mcp`, not the
Focus Bro website URL and not a Supabase URL. The diagnostics should show:

1. Worker health reachable.
2. Protected-resource discovery available.
3. Authorization-server metadata available.

Discovery success alone is not an authenticated provider connection. The
current `/oauth/authorize` and `/oauth/token` routes intentionally return
`501` until OAuth is implemented.

## ChatGPT or Claude cannot connect

This is expected while OAuth is disabled. Do not paste a Supabase access token,
password, service-role key, or browser session into an AI chat. Wait for the
OAuth phase, then reconnect from the provider’s connector settings using the
Worker `/mcp` endpoint.

## A grant is missing or revoked

Sign in to the same Focus Bro account used by the PWA, then reopen AI Connect.
The dashboard reads only grants owned by that signed-in user. A revoked grant
must be re-authorized after OAuth is available.

## Data appears different on another device

Confirm both devices use the same Focus Bro account. Keep the app online long
enough for sync to finish before closing it. The current PWA syncs the
RLS-protected `focus_bro_state` row; it does not merge conflicting edits from
two devices field-by-field.

## Production readiness

Do not enable public provider connections until these pass:

- PKCE success, wrong-verifier, replay, and redirect-mismatch tests.
- Token audience, expiry, scope, revocation, and refresh-reuse tests.
- Cross-user RLS read/write tests.
- Input-size, schema-fuzzing, rate-limit, and audit-redaction tests.
- Real ChatGPT and Claude consent/revoke tests.
