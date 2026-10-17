create table if not exists public.focus_bro_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.focus_bro_state enable row level security;

drop policy if exists "Users can read their own Focus Bro state" on public.focus_bro_state;
drop policy if exists "Users can insert their own Focus Bro state" on public.focus_bro_state;
drop policy if exists "Users can update their own Focus Bro state" on public.focus_bro_state;

create policy "Users can read their own Focus Bro state"
  on public.focus_bro_state for select
  using (auth.uid() = user_id);

create policy "Users can insert their own Focus Bro state"
  on public.focus_bro_state for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own Focus Bro state"
  on public.focus_bro_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
