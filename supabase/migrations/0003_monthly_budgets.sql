-- Monthly budgets: per-user, per-month income and spend allocation.
-- `month` is stored as the first day of the month (e.g. 2026-06-01).
-- `allocation` is the "net balance" — what the user allocates to spend that
-- month; remaining balance = allocation minus expenses logged for the month.

create table if not exists public.monthly_budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  month       date not null,
  income      numeric(12, 2) not null default 0 check (income >= 0),
  allocation  numeric(12, 2) not null default 0 check (allocation >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- One row per user per month (enables upsert on conflict).
create unique index if not exists monthly_budgets_user_month_idx
  on public.monthly_budgets (user_id, month);

alter table public.monthly_budgets enable row level security;

-- Owners only — every policy scoped to auth.uid().
create policy "monthly_budgets_select_own"
  on public.monthly_budgets for select
  using (auth.uid() = user_id);

create policy "monthly_budgets_insert_own"
  on public.monthly_budgets for insert
  with check (auth.uid() = user_id);

create policy "monthly_budgets_update_own"
  on public.monthly_budgets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "monthly_budgets_delete_own"
  on public.monthly_budgets for delete
  using (auth.uid() = user_id);
