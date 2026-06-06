-- Categories: per-user expense categories (name, description, icon).
-- Defaults (Food & Drinking, Transport, Bills, Shopping, Travel) are seeded
-- server-side on first load; users can add their own.

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  description text,
  icon        text not null default 'tag',
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- One name per user.
create unique index if not exists categories_user_name_idx
  on public.categories (user_id, lower(name));

create index if not exists categories_user_idx
  on public.categories (user_id, created_at);

alter table public.categories enable row level security;

-- Owners only — every policy scoped to auth.uid().
create policy "categories_select_own"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "categories_insert_own"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "categories_update_own"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "categories_delete_own"
  on public.categories for delete
  using (auth.uid() = user_id);
