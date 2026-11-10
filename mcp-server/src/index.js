const readline = require('node:readline');

const supabaseUrl = process.env.FOCUS_BRO_SUPABASE_URL;
const publishableKey = process.env.FOCUS_BRO_SUPABASE_PUBLISHABLE_KEY;
const accessToken = process.env.FOCUS_BRO_SUPABASE_ACCESS_TOKEN;

function errorResponse(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

function send(message) {
  process.stdout.write(JSON.stringify(message) + '\n');
}

async function supabaseRequest(path, options) {
  if (!supabaseUrl || !publishableKey || !accessToken) {
    throw new Error('Set FOCUS_BRO_SUPABASE_URL, FOCUS_BRO_SUPABASE_PUBLISHABLE_KEY, and FOCUS_BRO_SUPABASE_ACCESS_TOKEN.');
  }
  const response = await fetch(supabaseUrl + path, {
    ...options,
    headers: {
      apikey: publishableKey,
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
      ...(options && options.headers)
    }
  });
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { message: text };
  }
  if (!response.ok) {
    throw new Error(body.message || body.msg || 'Supabase request failed (' + response.status + ').');
  }
  return body;
}

async function currentUser() {
  return supabaseRequest('/auth/v1/user', { method: 'GET' });
}

async function callTool(name, arguments_) {
  const user = await currentUser();
  if (name === 'get_focus_bro_state') {
    const rows = await supabaseRequest(
      '/rest/v1/focus_bro_state?select=state,updated_at&user_id=eq.' + encodeURIComponent(user.id),
      { method: 'GET' }
    );
    return rows[0] || { state: {}, updated_at: null };
  }
  if (name === 'save_focus_bro_state') {
    if (!arguments_ || !arguments_.state || typeof arguments_.state !== 'object' || Array.isArray(arguments_.state)) {
      throw new Error('state must be a JSON object.');
    }
    await supabaseRequest('/rest/v1/focus_bro_state?on_conflict=user_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        user_id: user.id,
        state: arguments_.state,
        updated_at: new Date().toISOString()
      })
    });
    return { saved: true, user_id: user.id };
  }
  throw new Error('Unknown tool: ' + name);
}

const tools = [
  {
    name: 'get_focus_bro_state',
    description: 'Read the authenticated Focus Bro account state, including lessons, tasks, timetable, reflections, and progress.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'save_focus_bro_state',
    description: 'Replace the authenticated Focus Bro account state with the supplied JSON object.',
    inputSchema: {
      type: 'object',
      properties: { state: { type: 'object', description: 'The complete Focus Bro state document.' } },
      required: ['state']
    }
  }
];

const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
input.on('line', async line => {
  if (!line.trim()) return;
  let request;
  try {
    request = JSON.parse(line);
  } catch {
    send(errorResponse(null, -32700, 'Invalid JSON.'));
    return;
  }
  if (!Object.prototype.hasOwnProperty.call(request, 'id')) return;
  try {
    let result;
    if (request.method === 'initialize') {
      result = {
        protocolVersion: '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: { name: 'focus-bro', version: '1.0.0' }
      };
    } else if (request.method === 'tools/list') {
      result = { tools };
    } else if (request.method === 'tools/call') {
      const output = await callTool(request.params && request.params.name, request.params && request.params.arguments);
      result = { content: [{ type: 'text', text: JSON.stringify(output, null, 2) }], structuredContent: output };
    } else if (request.method === 'ping') {
      result = {};
    } else {
      send(errorResponse(request.id, -32601, 'Method not found.'));
      return;
    }
    send({ jsonrpc: '2.0', id: request.id, result });
  } catch (error) {
    send(errorResponse(request.id, -32000, error.message));
  }
});
