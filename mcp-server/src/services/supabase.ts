export interface SupabaseEnv {
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
}

export interface SupabaseUser {
  id: string;
}

export function bearerToken(request: Request): string {
  const header = request.headers.get('Authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) throw new Error('Authentication required.');
  return match[1];
}

async function requestSupabase<T>(
  env: SupabaseEnv,
  token: string,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${env.SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  });
  const body = await response.text();
  let value: unknown = {};
  try {
    value = body ? JSON.parse(body) : {};
  } catch {
    value = { message: 'Supabase returned an invalid response.' };
  }
  if (!response.ok) throw new Error('Supabase request failed.');
  return value as T;
}

export function currentUser(env: SupabaseEnv, token: string): Promise<SupabaseUser> {
  return requestSupabase<SupabaseUser>(env, token, '/auth/v1/user');
}

export function getState(env: SupabaseEnv, token: string, userId: string): Promise<Array<{ state: object; updated_at: string }>> {
  return requestSupabase(env, token, `/rest/v1/focus_bro_state?select=state,updated_at&user_id=eq.${encodeURIComponent(userId)}`);
}

export function saveState(env: SupabaseEnv, token: string, userId: string, state: object): Promise<unknown> {
  return requestSupabase(env, token, '/rest/v1/focus_bro_state?on_conflict=user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: userId, state, updated_at: new Date().toISOString() })
  });
}
