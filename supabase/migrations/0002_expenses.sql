-- Expenses: per-user spend entries. Each row links to one category, an amount,
-- the date it was spent, and an optional note. Scoped to the owner via RLS.

create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  amount      numeric(12, 2) not null check (amount > 0),
  spent_at    date not null default current_date,
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists expenses_user_date_idx
  on public.expenses (user_id, spent_at desc);

create index if not exists expenses_category_idx
  on public.expenses (category_id);

alter table public.expenses enable row level security;

-- Owners only — every policy scoped to auth.uid().
create policy "expenses_select_own"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "expenses_insert_own"
  on public.expenses for insert
  with check (auth.uid() = user_id);

create policy "expenses_update_own"
  on public.expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "expenses_delete_own"
  on public.expenses for delete
  using (auth.uid() = user_id);
