-- Phase 4 OAuth persistence contract.
-- Apply only after reviewing MCP-ARCHITECTURE.md and MCP-SECURITY.md.
create table if not exists public.mcp_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  provider text not null check (provider in ('chatgpt', 'claude')),
  resource text not null,
  scopes text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

alter table public.mcp_grants enable row level security;

create policy "Users can read their own MCP grants"
  on public.mcp_grants for select using (auth.uid() = user_id);

create policy "Users can revoke their own MCP grants"
  on public.mcp_grants for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists mcp_grants_user_status_idx
  on public.mcp_grants (user_id, status);
