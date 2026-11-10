const config = {
  url: process.env.FOCUS_BRO_SUPABASE_URL,
  publishableKey: process.env.FOCUS_BRO_SUPABASE_PUBLISHABLE_KEY,
  accessToken: process.env.FOCUS_BRO_SUPABASE_ACCESS_TOKEN
};

function requireConfig() {
  if (!config.url || !config.publishableKey || !config.accessToken) {
    throw new Error('Set FOCUS_BRO_SUPABASE_URL, FOCUS_BRO_SUPABASE_PUBLISHABLE_KEY, and FOCUS_BRO_SUPABASE_ACCESS_TOKEN.');
  }
}

async function request(path, options) {
  requireConfig();
  const response = await fetch(config.url + path, {
    ...options,
    headers: {
      apikey: config.publishableKey,
      Authorization: 'Bearer ' + config.accessToken,
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
  return request('/auth/v1/user', { method: 'GET' });
}

module.exports = { currentUser, request };
