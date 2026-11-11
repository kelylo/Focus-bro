import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { registerStateTools } from './tools/state-tools';
import { registerReadTools } from './tools/read-tools';
import { registerWriteTools } from './tools/write-tools';
import { bearerToken, type SupabaseEnv } from './services/supabase';

interface Env extends SupabaseEnv {
  MCP_ENABLE_WRITE_TOOLS?: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

function server(env: Env, token: string): McpServer {
  const mcp = new McpServer({ name: 'focus-bro', version: '0.1.0' });
  registerStateTools(mcp, env, token);
  registerReadTools(mcp, env, token);
  registerWriteTools(mcp, env, token);
  return mcp;
}

function metadata(url: URL): Response {
  const resource = `${url.origin}/mcp`;
  return json({
    resource,
    authorization_servers: [url.origin],
    scopes_supported: ['academic.read', 'academic.write', 'resources.read', 'analytics.read'],
    bearer_methods_supported: ['header']
  });
}

function authorizationMetadata(url: URL): Response {
  return json({
    issuer: url.origin,
    authorization_endpoint: `${url.origin}/oauth/authorize`,
    token_endpoint: `${url.origin}/oauth/token`,
    revocation_endpoint: `${url.origin}/oauth/revoke`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: ['academic.read', 'academic.write', 'resources.read', 'analytics.read']
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/health' && request.method === 'GET') return json({ ok: true, service: 'focus-bro-mcp' });
    if (url.pathname === '/.well-known/oauth-protected-resource' && request.method === 'GET') return metadata(url);
    if (url.pathname === '/.well-known/oauth-authorization-server' && request.method === 'GET') return authorizationMetadata(url);
    if (url.pathname.startsWith('/oauth/')) {
      return json({ error: 'OAuth authorization is not enabled on this deployment yet. Deploy Phase 4 grant storage and consent routes before connecting an AI provider.' }, 501);
    }
    if (url.pathname !== '/mcp') return json({ error: 'Not found.' }, 404);
    if (request.method !== 'POST' && request.method !== 'GET' && request.method !== 'DELETE') {
      return json({ error: 'Method not allowed.' }, 405);
    }
    let token: string;
    try {
      token = bearerToken(request);
    } catch {
      return new Response(JSON.stringify({ error: 'Authentication required.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'WWW-Authenticate': 'Bearer' }
      });
    }
    try {
      const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await server(env, token).connect(transport);
      return await transport.handleRequest(request);
    } catch {
      return json({ error: 'The MCP request could not be completed.' }, 500);
    }
  }
};
