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

-- Keep registration private. Insert the owner's lower-case email before enabling
-- the trigger below; the empty table intentionally rejects every new signup.
create table if not exists public.focus_bro_allowed_users (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

alter table public.focus_bro_allowed_users enable row level security;

create or replace function public.focus_bro_check_allowed_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.focus_bro_allowed_users
    where email = lower(new.email)
  ) then
    raise exception 'This Focus Bro account is not authorized.';
  end if;
  return new;
end;
$$;

drop trigger if exists focus_bro_restrict_signup on auth.users;
create trigger focus_bro_restrict_signup
before insert on auth.users
for each row execute function public.focus_bro_check_allowed_user();
