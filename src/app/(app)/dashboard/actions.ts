"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  DEFAULT_CATEGORIES,
  ICON_KEYS,
  type BudgetRow,
  type Category,
  type Expense,
  type IconKey,
  type MonthlyOverview,
  type WeeklyBar,
} from "@/lib/categories";

const SELECT = "id, name, description, icon, is_default, monthly_limit";

// Supabase returns numeric columns as strings — coerce monthly_limit.
function toCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    icon: row.icon as string,
    is_default: Boolean(row.is_default),
    monthly_limit: Number(row.monthly_limit ?? 0),
  };
}

// Fetch the signed-in user's categories. On first load (none yet) seed the
// defaults, then return the fresh list. Always scoped to the current user.
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("categories")
    .select(SELECT)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  if (data && data.length > 0) return data.map(toCategory);

  // Seed defaults for this user.
  const seed = DEFAULT_CATEGORIES.map((c) => ({
    user_id: user.id,
    name: c.name,
    description: c.description,
    icon: c.icon,
    is_default: true,
  }));
  const { data: seeded, error: seedErr } = await supabase
    .from("categories")
    .insert(seed)
    .select(SELECT);
  if (seedErr) throw new Error(seedErr.message);

  return (seeded ?? []).map(toCategory);
}

export type ActionResult = { error?: string; ok?: boolean };

export async function createCategory(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const iconRaw = String(formData.get("icon") ?? "tag");
  const icon: IconKey = (ICON_KEYS as readonly string[]).includes(iconRaw)
    ? (iconRaw as IconKey)
    : "tag";

  if (!name) return { error: "Name is required." };

  const limitRaw = Number(formData.get("monthly_limit"));
  const monthly_limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 0;

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name,
    description: description || null,
    icon,
    is_default: false,
    monthly_limit,
  });
  if (error) {
    // Unique index → duplicate name.
    if (error.code === "23505") return { error: "A category with that name exists." };
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateCategory(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing category id." };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const iconRaw = String(formData.get("icon") ?? "tag");
  const icon: IconKey = (ICON_KEYS as readonly string[]).includes(iconRaw)
    ? (iconRaw as IconKey)
    : "tag";
  if (!name) return { error: "Name is required." };

  const limitRaw = Number(formData.get("monthly_limit"));
  const monthly_limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 0;

  // RLS scopes the update to the owner.
  const { error } = await supabase
    .from("categories")
    .update({ name, description: description || null, icon, monthly_limit })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") return { error: "A category with that name exists." };
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function createExpense(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const categoryId = String(formData.get("category_id") ?? "").trim();
  const spentAt = String(formData.get("spent_at") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const amount = Number(formData.get("amount"));

  if (!categoryId) return { error: "Pick a category." };
  if (!spentAt || Number.isNaN(Date.parse(spentAt))) return { error: "Pick a valid date." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter an amount greater than 0." };

  const { error } = await supabase.from("expenses").insert({
    user_id: user.id,
    category_id: categoryId,
    amount,
    spent_at: spentAt,
    note: note || null,
  });
  if (error) {
    // Foreign key violation → category isn't the user's.
    if (error.code === "23503") return { error: "That category no longer exists." };
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

const EXPENSE_SELECT = "id, amount, spent_at, note, category_id, categories ( name, icon )";

function mapExpense(row: Record<string, unknown>): Expense {
  const c = row.categories as { name?: string; icon?: string } | { name?: string; icon?: string }[] | null;
  const cat = Array.isArray(c) ? c[0] : c;
  return {
    id: row.id as string,
    amount: Number(row.amount),
    spent_at: row.spent_at as string,
    note: (row.note as string | null) ?? null,
    category_id: (row.category_id as string | null) ?? null,
    category_name: cat?.name ?? null,
    category_icon: cat?.icon ?? null,
  };
}

// Fetch the user's expenses, newest first, with category name/icon resolved.
export async function getExpenses(limit = 50): Promise<Expense[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("expenses")
    .select(EXPENSE_SELECT)
    .order("spent_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  return (data ?? []).map(mapExpense);
}

// All expenses within a calendar month ("YYYY-MM"), newest first.
export async function getExpensesByMonth(month: string): Promise<Expense[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return [];
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const nextM = m === 12 ? 1 : m + 1;
  const nextY = m === 12 ? y + 1 : y;
  const end = `${nextY}-${String(nextM).padStart(2, "0")}-01`;

  const { data, error } = await supabase
    .from("expenses")
    .select(EXPENSE_SELECT)
    .gte("spent_at", start)
    .lt("spent_at", end)
    .order("spent_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map(mapExpense);
}

export async function updateExpense(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing expense id." };

  const categoryId = String(formData.get("category_id") ?? "").trim();
  const spentAt = String(formData.get("spent_at") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const amount = Number(formData.get("amount"));

  if (!categoryId) return { error: "Pick a category." };
  if (!spentAt || Number.isNaN(Date.parse(spentAt))) return { error: "Pick a valid date." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter an amount greater than 0." };

  const { error } = await supabase
    .from("expenses")
    .update({ category_id: categoryId, amount, spent_at: spentAt, note: note || null })
    .eq("id", id);
  if (error) {
    if (error.code === "23503") return { error: "That category no longer exists." };
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteExpense(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing expense id." };

  // RLS scopes the delete to the owner.
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

// Anchor = first day of the selected month ("YYYY-MM"), or the current month.
function anchorDate(month?: string): Date {
  if (month) {
    const [y, m] = month.split("-").map(Number);
    if (y && m) return new Date(y, m - 1, 1);
  }
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), 1);
}
function ymFirst(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function isCurrentMonth(anchor: Date): boolean {
  const n = new Date();
  return anchor.getFullYear() === n.getFullYear() && anchor.getMonth() === n.getMonth();
}
function monthLabelOf(anchor: Date): string {
  return anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Build the Overview for `month` (default current): income/allocation plus
// summed expenses, with the previous month for deltas.
export async function getOverview(month?: string): Promise<MonthlyOverview> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const anchor = anchorDate(month);
  const cur = ymFirst(anchor);
  const prev = ymFirst(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1));
  const next = ymFirst(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1));
  const empty: MonthlyOverview = {
    monthLabel: monthLabelOf(anchor),
    isSet: false,
    income: 0,
    allocation: 0,
    spending: 0,
    prevIncome: 0,
    prevAllocation: 0,
    prevSpending: 0,
    budgets: [],
  };
  if (!user) return empty;

  // Budgets for the selected + previous month.
  const { data: budgets, error: bErr } = await supabase
    .from("monthly_budgets")
    .select("month, income, allocation")
    .in("month", [cur, prev]);
  if (bErr) throw new Error(bErr.message);

  const curB = budgets?.find((b) => b.month === cur);
  const prevB = budgets?.find((b) => b.month === prev);

  // Expenses from the start of last month up to the start of next month,
  // bucketed into current vs previous in JS.
  const { data: exp, error: eErr } = await supabase
    .from("expenses")
    .select("amount, spent_at, category_id")
    .gte("spent_at", prev)
    .lt("spent_at", next);
  if (eErr) throw new Error(eErr.message);

  let spending = 0;
  let prevSpending = 0;
  const spentByCat = new Map<string, number>(); // current month only
  for (const row of exp ?? []) {
    const amt = Number(row.amount);
    if ((row.spent_at as string) >= cur) {
      spending += amt;
      const cid = row.category_id as string | null;
      if (cid) spentByCat.set(cid, (spentByCat.get(cid) ?? 0) + amt);
    } else {
      prevSpending += amt;
    }
  }

  // Budgets card: every category that has spending this month or a limit set.
  // Rows with a limit show spent/limit; limitless rows just show the spend.
  const { data: cats, error: cErr } = await supabase
    .from("categories")
    .select("id, name, icon, monthly_limit");
  if (cErr) throw new Error(cErr.message);

  const budgetRows: BudgetRow[] = (cats ?? [])
    .map((c) => ({
      name: c.name as string,
      icon: c.icon as string,
      spent: spentByCat.get(c.id as string) ?? 0,
      limit: Number(c.monthly_limit),
    }))
    .filter((b) => b.spent > 0 || b.limit > 0)
    .sort((a, b) => b.spent - a.spent || b.limit - a.limit);

  return {
    monthLabel: monthLabelOf(anchor),
    isSet: !!curB,
    income: Number(curB?.income ?? 0),
    allocation: Number(curB?.allocation ?? 0),
    spending,
    prevIncome: Number(prevB?.income ?? 0),
    prevAllocation: Number(prevB?.allocation ?? 0),
    prevSpending,
    budgets: budgetRows,
  };
}

// Monday-based start of the week containing `d` (local).
function weekStart(d: Date): Date {
  const dow = (d.getDay() + 6) % 7; // 0 = Monday
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow);
}
function isoDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// Total expenses per week for the last `weeks` weeks ending in the anchor
// month (current week if the anchor is the current month).
export async function getWeeklySpending(weeks = 8, month?: string): Promise<WeeklyBar[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const anchor = anchorDate(month);
  const ref = isCurrentMonth(anchor)
    ? new Date()
    : new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0); // last day of month
  const curWeek = weekStart(ref);
  const start = new Date(curWeek);
  start.setDate(curWeek.getDate() - (weeks - 1) * 7);

  const bars: WeeklyBar[] = Array.from({ length: weeks }, (_, i) => {
    const ws = new Date(start);
    ws.setDate(start.getDate() + i * 7);
    return { label: ws.toLocaleDateString("en-US", { month: "short", day: "numeric" }), total: 0 };
  });
  if (!user) return bars;

  const { data, error } = await supabase
    .from("expenses")
    .select("amount, spent_at")
    .gte("spent_at", isoDate(start));
  if (error) throw new Error(error.message);

  const wk = 7 * 86_400_000;
  for (const row of data ?? []) {
    const [y, m, d] = (row.spent_at as string).split("-").map(Number);
    const ws = weekStart(new Date(y, m - 1, d));
    const idx = Math.round((ws.getTime() - start.getTime()) / wk);
    if (idx >= 0 && idx < weeks) bars[idx].total += Number(row.amount);
  }
  return bars;
}

// Total expenses per month for the last `months` months ending at the anchor
// month (default current), oldest → newest.
export async function getMonthlySpending(months = 6, month?: string): Promise<WeeklyBar[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const anchor = anchorDate(month);
  const startY = anchor.getFullYear();
  const startM = anchor.getMonth() - (months - 1);

  const bars: WeeklyBar[] = Array.from({ length: months }, (_, i) => {
    const d = new Date(startY, startM + i, 1);
    return { label: d.toLocaleDateString("en-US", { month: "short" }), total: 0 };
  });
  if (!user) return bars;

  const start = new Date(startY, startM, 1);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
  const { data, error } = await supabase
    .from("expenses")
    .select("amount, spent_at")
    .gte("spent_at", isoDate(start))
    .lt("spent_at", isoDate(end));
  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    const [y, m] = (row.spent_at as string).split("-").map(Number);
    const idx = (y - start.getFullYear()) * 12 + (m - 1 - start.getMonth());
    if (idx >= 0 && idx < months) bars[idx].total += Number(row.amount);
  }
  return bars;
}

// Everything the Overview tab needs for a given month, in one round-trip.
export async function getOverviewData(month: string): Promise<{
  overview: MonthlyOverview;
  weekly: WeeklyBar[];
  monthly: WeeklyBar[];
  expenses: Expense[];
}> {
  const [overview, weekly, monthly, expenses] = await Promise.all([
    getOverview(month),
    getWeeklySpending(8, month),
    getMonthlySpending(6, month),
    getExpensesByMonth(month),
  ]);
  return { overview, weekly, monthly, expenses: expenses.slice(0, 10) };
}

// Upsert the income + spend allocation (net balance) for the chosen month
// (hidden `month` field, "YYYY-MM"); defaults to the current month.
export async function setMonthlyBudget(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const income = Number(formData.get("income"));
  const allocation = Number(formData.get("allocation"));
  const month = ymFirst(anchorDate(String(formData.get("month") ?? "") || undefined));

  if (!Number.isFinite(income) || income < 0) return { error: "Income must be 0 or more." };
  if (!Number.isFinite(allocation) || allocation < 0)
    return { error: "Net balance must be 0 or more." };

  const { error } = await supabase
    .from("monthly_budgets")
    .upsert(
      { user_id: user.id, month, income, allocation, updated_at: new Date().toISOString() },
      { onConflict: "user_id,month" },
    );
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteCategory(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing category id." };

  // RLS already scopes to the owner; default rows are protected too.
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("is_default", false);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return {};
}
