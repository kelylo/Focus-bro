const { request } = require('../auth/supabase');

async function getState(userId) {
  const rows = await request(
    '/rest/v1/focus_bro_state?select=state,updated_at&user_id=eq.' + encodeURIComponent(userId),
    { method: 'GET' }
  );
  return rows[0] || { state: {}, updated_at: null };
}

async function saveState(userId, state) {
  await request('/rest/v1/focus_bro_state?on_conflict=user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: userId, state, updated_at: new Date().toISOString() })
  });
  return { saved: true, user_id: userId };
}

module.exports = { getState, saveState };
