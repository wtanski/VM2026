-- VM-tips 2026: minimal schema for groups + invites + user search.
-- Apply this in Supabase SQL editor.
--
-- Requires extensions:
create extension if not exists "pgcrypto";

-- Public profiles (used for user search + display names).
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  updated_at timestamptz not null default now()
);

-- If you already have the profiles table, run this to add the username column:
--   alter table public.profiles add column if not exists username text unique;

-- Index for fast username lookups
create index if not exists profiles_username_idx on public.profiles (username);

-- Automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );
  return new;
end;
$$;

-- Trigger to call handle_new_user on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- If you already have users without profiles, run this to create profiles for them:
--   insert into public.profiles (id, display_name)
--   select 
--     u.id,
--     coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name')
--   from auth.users u
--   left join public.profiles p on p.id = u.id
--   where p.id is null;

alter table public.profiles enable row level security;

create policy "profiles are viewable by authenticated"
on public.profiles for select
to authenticated
using (true);

create policy "users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "users can insert own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

-- Groups
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- If you already created the table without created_by, run:
--   alter table public.groups add column if not exists created_by uuid;
--   alter table public.groups add constraint groups_created_by_fkey
--     foreign key (created_by) references auth.users(id) on delete cascade;
--   alter table public.groups alter column created_by set not null;

alter table public.groups enable row level security;

-- Memberships
create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.group_members enable row level security;

-- Invites (token is stored as plain text for simplicity; you can hash it later).
create table if not exists public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz,
  max_uses int,
  uses int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.group_invites enable row level security;

-- Helpers: "is member" check via EXISTS
create or replace function public.is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = p_user_id
  );
$$;

-- Policies
create policy "members can view their groups"
on public.groups for select
to authenticated
using (public.is_group_member(id, auth.uid()));

create policy "authenticated can create groups"
on public.groups for insert
to authenticated
with check (created_by = auth.uid());

create policy "members can view group members"
on public.group_members for select
to authenticated
using (public.is_group_member(group_id, auth.uid()));

create policy "users can join group (self insert)"
on public.group_members for insert
to authenticated
with check (user_id = auth.uid());

create policy "group creator can manage invites"
on public.group_invites for all
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

