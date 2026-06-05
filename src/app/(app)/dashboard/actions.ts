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

// Fetch the user's expenses, newest first, with category name/icon resolved.
export async function getExpenses(limit = 50): Promise<Expense[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("expenses")
    .select("id, amount, spent_at, note, categories ( name, icon )")
    .order("spent_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories;
    return {
      id: row.id as string,
      amount: Number(row.amount),
      spent_at: row.spent_at as string,
      note: (row.note as string | null) ?? null,
      category_name: cat?.name ?? null,
      category_icon: cat?.icon ?? null,
    };
  });
}

// First-of-month "YYYY-MM-01" string, offset by `monthsBack` months.
function monthStart(monthsBack = 0): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-01`;
}

// Build the current-month Overview: income/allocation set by the user plus
// summed expenses, for the current and previous month (for deltas).
export async function getOverview(): Promise<MonthlyOverview> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cur = monthStart(0);
  const prev = monthStart(1);
  const next = monthStart(-1);
  const empty: MonthlyOverview = {
    monthLabel: new Date(cur).toLocaleDateString("en-US", { month: "long" }),
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

  // Budgets for current + previous month.
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
    monthLabel: new Date(cur).toLocaleDateString("en-US", { month: "long" }),
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

// Total expenses per week for the last `weeks` weeks (oldest → current).
export async function getWeeklySpending(weeks = 8): Promise<WeeklyBar[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const curWeek = weekStart(new Date());
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

// Upsert the current month's income + spend allocation (net balance).
export async function setMonthlyBudget(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const income = Number(formData.get("income"));
  const allocation = Number(formData.get("allocation"));

  if (!Number.isFinite(income) || income < 0) return { error: "Income must be 0 or more." };
  if (!Number.isFinite(allocation) || allocation < 0)
    return { error: "Net balance must be 0 or more." };

  const { error } = await supabase
    .from("monthly_budgets")
    .upsert(
      { user_id: user.id, month: monthStart(0), income, allocation, updated_at: new Date().toISOString() },
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
