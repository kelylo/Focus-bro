# Focus Bro MCP security model

Status: **Phase 9 documentation — production OAuth controls remain not implemented**

## Security invariants

1. Every MCP request maps to exactly one authenticated Focus Bro user.
2. The user identity comes from a verified Supabase session during consent or
   from a validated MCP token subject; it never comes from a caller argument.
3. Every token is bound to the MCP resource/audience, client, grant, and scopes.
4. Supabase RLS remains active for user-owned data.
5. The MCP endpoint exposes narrow tools, never raw SQL or unrestricted JSON.
6. Browser sessions, Supabase publishable keys, client secrets, authorization
   codes, access tokens, and refresh tokens are never logged or rendered.

## OAuth protections

- Require Authorization Code + PKCE with `S256`; reject `plain`.
- Require exact pre-registered redirect URI matching.
- Require and verify `state`; the Worker generates and validates its own
  consent transaction state where it owns the browser handoff.
- Require an exact resource parameter and use it as the token audience.
- Make authorization codes short-lived, single-use, and store only a hash.
- Use short-lived access tokens and rotating refresh tokens.
- Detect refresh-token reuse and revoke the entire token family.
- Validate issuer, audience/resource, subject, client, grant status, scopes,
  expiry, and not-before on every request.
- Revoke grants and token families immediately when the user disconnects,
  permissions change, or suspicious reuse is detected.
- Return standards-compatible `401`/`403` challenges without revealing
  whether another user's grant exists.

## Supabase protections

The current database has one RLS-protected `focus_bro_state` row per user.
Phase 3 must add server-side OAuth metadata and audit tables with:

- UUID primary keys and foreign keys to `auth.users` where applicable.
- RLS policies that allow a user to see and revoke only their own grants.
- No client-readable refresh-token or authorization-code columns.
- Restricted insert/update paths for server-side token operations.
- `updated_at`, expiry, revoked, and rotation state fields.

The Worker must use the authenticated user's token where possible so existing
RLS proves the association. If a server-side credential is needed for an
OAuth-only operation, it must be a Worker secret with narrow database
permissions and never be exposed to a browser or MCP client.

## Tool security

Before dispatch:

1. Parse JSON with a maximum body size.
2. Validate the tool name against an allowlist.
3. Validate arguments with a strict schema: types, lengths, enum values,
   dates, IDs, and maximum result sizes.
4. Resolve the user from the token, not arguments.
5. Check the required scope.
6. Apply per-tool rate limits.
7. Read or mutate only records owned by that user.
8. Audit the action without storing private note text or prompt contents.

Prompt injection from notes, video titles, or other user content is untrusted
data. Tool descriptions and returned records must not instruct the model to
change permissions, reveal tokens, call unrelated tools, or bypass
confirmation. Returned academic content should be clearly separated from
system/tool instructions.

## Write safety

Initial write tools are create/update only. They must:

- use idempotency keys where duplicate creation is possible;
- return the created/updated record identifier and a safe summary;
- reject oversized content and invalid ownership references;
- require `academic.write`;
- support explicit confirmation before mutation;
- record success/failure and the grant ID in audit logs.

No delete tool, raw database tool, credential tool, or permission-management
tool is exposed through MCP.

## Abuse and availability controls

- Rate-limit by IP, client ID, grant ID, user ID, and tool category.
- Apply stricter limits to authorization, token, refresh, and write endpoints.
- Bound concurrent MCP sessions and response sizes.
- Reject malformed JSON-RPC, unsupported protocol versions, and invalid
  sessions early.
- Use Cloudflare WAF/bot controls and Workers limits.
- Use correlation IDs in logs; redact Authorization headers, cookies, codes,
  tokens, email addresses, note bodies, and full tool arguments.
- Alert on refresh reuse, repeated invalid PKCE, scope escalation, cross-user
  access attempts, and abnormal write rates.

## Error behavior

User-facing errors must be plain language and actionable. Protocol responses
must not include database SQL, stack traces, token values, or whether another
user owns a record. Detailed diagnostics stay in redacted server logs.

| Situation | Protocol behavior | User guidance |
|---|---|---|
| Missing/expired token | `401` plus resource metadata challenge | Reconnect the AI provider |
| Missing permission | `403` plus required scope | Approve the requested permission |
| Revoked grant | `401`/`403` without grant details | Reconnect from AI Connect |
| Invalid arguments | JSON-RPC invalid-params/tool error | Correct the requested value |
| Supabase/RLS denial | Safe tool error | Confirm the record belongs to you |
| Worker unavailable | HTTP 5xx with correlation ID | Retry later; check status page |

## Verification gates before production

- OAuth discovery tests for both metadata endpoints.
- PKCE success, wrong verifier, replay, and redirect mismatch tests.
- Token audience, expiry, issuer, scope, revocation, and refresh-reuse tests.
- Cross-user read/write tests using two Supabase accounts.
- RLS tests for every tool adapter.
- Schema fuzzing and maximum-size tests for every tool.
- Prompt-injection fixtures in notes and resource titles.
- Rate-limit and audit-redaction tests.
- End-to-end consent and revoke tests with a real MCP client.

No production connection should be advertised until these gates pass.
