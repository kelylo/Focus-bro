const readline = require('node:readline');
const stateTools = require('./tools/state-tools');

function errorResponse(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

function send(message) {
  process.stdout.write(JSON.stringify(message) + '\n');
}

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
      result = { protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'focus-bro', version: '1.0.0' } };
    } else if (request.method === 'tools/list') {
      result = { tools: stateTools.tools };
    } else if (request.method === 'tools/call') {
      const output = await stateTools.call(request.params && request.params.name, request.params && request.params.arguments);
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
