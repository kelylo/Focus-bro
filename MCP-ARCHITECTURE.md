# Focus Bro MCP architecture

Status: **Phase 2 design — not implemented**

## Goals and boundaries

The MCP service will be an independently deployable Cloudflare Worker using
Streamable HTTP. It will be a resource server for the canonical MCP endpoint,
not a second Focus Bro frontend and not a direct database proxy.

The browser remains responsible for Focus Bro sign-in and the future AI
Connect dashboard. Supabase remains the system of record and enforces row-level
security. The Worker owns MCP discovery, OAuth grants, token validation,
permission checks, tool validation, rate limits, and audit events.

No client will receive a Supabase service-role key. An AI client will receive
only an MCP access token whose subject and scopes are bound to one Focus Bro
user.

## Components

| Component | Responsibility |
|---|---|
| Focus Bro PWA | Starts connection, displays consent, status, permissions, revoke/disconnect, and connection test |
| Supabase Auth | Authenticates the Focus Bro user and supplies the identity used during consent |
| MCP Worker | OAuth authorization server facade, protected resource, Streamable HTTP MCP endpoint, policy enforcement |
| Supabase PostgreSQL | User-owned academic state, OAuth client/grant/token metadata, permissions, audit records |
| ChatGPT/Claude | OAuth MCP client; discovers metadata, opens authorization, stores client-side tokens, calls tools |

The existing `focus_bro_state` JSON document is the current data source. Tool
adapters must read and validate the known state keys; they must not expose an
arbitrary JSON path, SQL query, or unrestricted table operation. Normalized
academic tables can be introduced later as additive migrations.

## Endpoint layout

The production hostname must be HTTPS and dedicated to MCP, for example:

```text
https://mcp.focusbro.example
```

Required discovery and OAuth endpoints:

```text
GET  /.well-known/oauth-protected-resource
GET  /.well-known/oauth-authorization-server
POST /oauth/register              (only if dynamic registration is enabled)
GET  /oauth/authorize
POST /oauth/token
POST /oauth/revoke
GET  /mcp                         (Streamable HTTP session/status)
POST /mcp                         (JSON-RPC MCP messages)
DELETE /mcp                       (session cleanup, if supported by SDK)
```

The canonical resource identifier is the stable MCP origin plus `/mcp`, and
must be used consistently as the access-token audience and metadata resource.
The deployment must not silently accept alternate hosts or arbitrary resource
values.

## Authorization sequence

1. The AI client requests the protected resource metadata.
2. The client discovers the authorization server and supported PKCE methods.
3. The client registers dynamically if supported, otherwise uses a
   pre-registered client policy.
4. The client creates a random `state`, a high-entropy `code_verifier`, and
   `S256` `code_challenge`.
5. The client opens `/oauth/authorize` with its redirect URI, client ID,
   challenge, resource, and requested scopes.
6. The Worker requires the user to sign in through Supabase Auth if no valid
   Focus Bro session is present. The Worker never accepts a user ID from query
   parameters.
7. The consent screen shows the provider/client name, every requested
   permission, what data can be read or changed, and that write tools require
   confirmation.
8. After approval, the Worker stores a one-time authorization code bound to:
   user ID, client ID, exact redirect URI, PKCE challenge, resource, scopes,
   and expiry. It redirects with `code` and the original `state`.
9. The client exchanges the code at `/oauth/token` with the verifier.
10. The Worker verifies the code, redirect URI, client, challenge, resource,
    and single-use status, then issues a short-lived access token and a
    rotating refresh token.
11. The client calls `/mcp` using `Authorization: Bearer`.
12. The Worker validates signature, issuer, audience/resource, expiry,
    client binding, user subject, and scopes before dispatching a tool.
13. The Worker returns `401` with a resource metadata challenge for missing or
    invalid authentication, and `403` with an insufficient-scope challenge
    when step-up consent is required.

## Token and grant model

Tokens are opaque to clients and stored hashed at rest. Access tokens should
expire quickly (target: 10 minutes). Refresh tokens should be one-time-use
rotating tokens with reuse detection and a bounded lifetime (target: 30 days,
subject to provider compatibility).

Proposed records:

- `mcp_clients`: client ID, redirect URIs, client metadata, registration
  method, created/last-used timestamps, disabled status.
- `mcp_grants`: Focus Bro user ID, client ID, provider label, resource,
  approved scopes, status, created/last-used/revoked timestamps.
- `mcp_authorization_codes`: hashed one-time code, grant/client binding, PKCE
  challenge, redirect URI, resource, scopes, expiry, consumed timestamp.
- `mcp_refresh_tokens`: hashed token, grant ID, token family, expiry, rotation,
  replacement, revoked/reuse-detected timestamps.
- `mcp_audit_events`: user/grant/client/tool, action, result, timestamp,
  request correlation ID, and safe reason metadata.

The exact schema is a Phase 3 migration. All tables must have RLS or be
reachable only through narrowly scoped server-side operations. A service-role
credential, if required by a Worker operation, stays in Worker secrets and is
never sent to the browser or MCP client.

## Scope model

Scopes are additive and least-privilege:

```text
academic.read          Read tasks, timetable, subjects, notes, progress
academic.write         Create or update non-destructive academic records
resources.read         Search learning resources and read video progress
analytics.read         Read progress reports and derived analytics
```

The default request is `academic.read`. Write and analytics scopes require
explicit consent. Resource access is separate from academic data access.
There is deliberately no delete-all, raw SQL, arbitrary export, admin, or
service-role scope.

Tool-to-scope mapping:

| Scope | Tools |
|---|---|
| `academic.read` | overview, tasks, timetable, subjects, notes, deadlines |
| `resources.read` | search resources, video progress |
| `analytics.read` | study progress, weekly report, neglected subjects |
| `academic.write` | create/update task or note, flashcard, study session, goal |
| `academic.write` + `analytics.read` | generated revision/study plans |

Generated plans are proposals returned to the client. They do not write
records unless a separate write-tool call is approved.

## Consent and consequential actions

The Worker must not infer consent from a prior browser login. Consent is
per client, user, resource, and scope set. The AI Connect page shows active
grants and can revoke one provider/client without signing the user out of
Focus Bro.

Write tools must return a confirmation-required result unless the client
explicitly supports the MCP tool confirmation mechanism and the user approved
that action. The Worker should include a human-readable summary and affected
record identifiers before mutation. Destructive operations are not part of the
initial tool set.

## References

- [MCP Authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)
- [OAuth 2.0 Protected Resource Metadata (RFC 9728)](https://www.rfc-editor.org/rfc/rfc9728)
- [OAuth 2.0 Authorization Server Metadata (RFC 8414)](https://www.rfc-editor.org/rfc/rfc8414)
- [OAuth 2.0 Dynamic Client Registration (RFC 7591)](https://www.rfc-editor.org/rfc/rfc7591)
- [OAuth 2.1 draft](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1)
