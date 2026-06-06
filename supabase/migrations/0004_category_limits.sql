-- Per-category monthly spend limit, used by the Budgets card (spent vs limit).
-- 0 means "no limit set" — those categories are hidden from the Budgets card.

alter table public.categories
  add column if not exists monthly_limit numeric(12, 2) not null default 0
  check (monthly_limit >= 0);
