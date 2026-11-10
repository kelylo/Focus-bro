import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { registerStateTools } from './tools/state-tools';
import { bearerToken, type SupabaseEnv } from './services/supabase';

interface Env extends SupabaseEnv {}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

function server(env: Env, token: string): McpServer {
  const mcp = new McpServer({ name: 'focus-bro', version: '0.1.0' });
  registerStateTools(mcp, env, token);
  return mcp;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/health' && request.method === 'GET') return json({ ok: true, service: 'focus-bro-mcp' });
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
