"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createCategory,
  createExpense,
  deleteCategory,
  deleteExpense,
  setMonthlyBudget,
  updateCategory,
  updateExpense,
  type ActionResult,
} from "@/app/(app)/dashboard/actions";
import {
  ICON_KEYS,
  type Category,
  type Expense,
  type IconKey,
  type MonthlyOverview,
  type WeeklyBar,
} from "@/lib/categories";
import "./dashboard.css";

/* --- inline icons, stroke style matches quiet-auth --- */
const Ic = ({ children }: { children: React.ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

const PlusIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const UpIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 15l7-7 7 7" />
  </svg>
);
const DownIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 9l-7 7-7-7" />
  </svg>
);

const HomeIcon = () => (
  <Ic>
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M6 10.5V20h12v-9.5" />
  </Ic>
);
const FoodIcon = () => (
  <Ic>
    <path d="M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10" />
    <path d="M16 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4 2.5-1 2.5-4-1-5-2.5-5Zm0 13v5" />
  </Ic>
);
const CarIcon = () => (
  <Ic>
    <path d="M4 16v-3l2-5h12l2 5v3" />
    <path d="M3 16h18v3h-2v-2H5v2H3z" />
    <circle cx="7.5" cy="16.5" r="0.6" />
    <circle cx="16.5" cy="16.5" r="0.6" />
  </Ic>
);
const BagIcon = () => (
  <Ic>
    <path d="M6 8h12l-1 12H7L6 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </Ic>
);
const CodeIcon = () => (
  <Ic>
    <path d="m9 8-4 4 4 4M15 8l4 4-4 4" />
  </Ic>
);
const HeartIcon = () => (
  <Ic>
    <path d="M12 20s-7-4.6-7-9.5A3.7 3.7 0 0 1 12 7a3.7 3.7 0 0 1 7 3.5C19 15.4 12 20 12 20Z" />
  </Ic>
);
const BillIcon = () => (
  <Ic>
    <path d="M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21z" />
    <path d="M10 8h4M10 12h4" />
  </Ic>
);
const PlaneIcon = () => (
  <Ic>
    <path d="M10.5 3.5 4 14l2 .5 2 3 1.5-3.5 5 2.5L21 4 10.5 3.5Z" />
  </Ic>
);
const TagIcon = () => (
  <Ic>
    <path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9z" />
    <circle cx="7.5" cy="7.5" r="1.1" />
  </Ic>
);
const WalletIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7a2 2 0 0 1 2-2h12v4M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6H7" />
    <circle cx="17" cy="14" r="1" />
  </svg>
);

/* icon key -> SVG. Keys match ICON_KEYS in src/lib/categories.ts. */
const ICONS: Record<IconKey, () => React.ReactElement> = {
  food: FoodIcon,
  transport: CarIcon,
  bills: BillIcon,
  shopping: BagIcon,
  travel: PlaneIcon,
  home: HomeIcon,
  software: CodeIcon,
  health: HeartIcon,
  tag: TagIcon,
};
const CatIcon = ({ icon }: { icon: string }) => {
  const C = ICONS[(icon as IconKey)] ?? TagIcon;
  return <C />;
};

/* per-icon accent color for the category tiles */
const ICON_COLOR: Record<string, string> = {
  food: "#74e3b4",
  transport: "#e8c468",
  bills: "#7aa2f7",
  shopping: "#a78bfa",
  travel: "#5ec8d8",
  home: "#7aa2f7",
  software: "#5ec8d8",
  health: "#f7768e",
  tag: "#8b93a1",
};

type Stat = { label: string; value: string; cents?: string; delta: string; sub: string; dir: "pos" | "neg" };

function StatCard({ s }: { s: Stat }) {
  return (
    <div className="dash-card">
      <div className="label">{s.label}</div>
      <div className="value">
        {s.value}
        {s.cents && <span className="c">{s.cents}</span>}
      </div>
      <div className={"dash-delta " + s.dir}>
        {s.dir === "pos" ? <UpIcon /> : <DownIcon />}
        {s.delta} <span className="sub">{s.sub}</span>
      </div>
    </div>
  );
}

function pct(spent: number, limit: number) {
  return Math.min(100, Math.round((spent / limit) * 100));
}

// Main currency: Sri Lankan rupee. Symbol kept as a single const for easy swap.
const CUR = "Rs ";
const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Compact amount for tight spots (chart labels): 1234 -> "1.2k", 950 -> "950".
const fmtCompact = (n: number) => {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k";
  return Math.round(n).toString();
};

// "2026-06-05" -> "Jun 5". Parsed as local to avoid a UTC day shift.
const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// "Rs 1,860" + ".40", with a leading minus pulled outside the symbol.
const money = (n: number) => {
  const [int, dec] = fmtMoney(Math.abs(n)).split(".");
  return { value: (n < 0 ? "-" + CUR : CUR) + int, cents: "." + dec };
};

// Percent change vs last month. `goodWhenUp` flips the pos/neg color for
// metrics where a rise is bad (spending). No baseline → neutral dash.
function deltaOf(cur: number, prev: number, goodWhenUp: boolean): Pick<Stat, "delta" | "dir" | "sub"> {
  if (prev === 0) return { delta: "—", dir: "pos", sub: "no last month" };
  const change = ((cur - prev) / prev) * 100;
  const up = change >= 0;
  return {
    delta: (up ? "+" : "") + change.toFixed(1) + "%",
    dir: (goodWhenUp ? up : !up) ? "pos" : "neg",
    sub: "vs last month",
  };
}

function buildStats(o: MonthlyOverview): Stat[] {
  const net = o.allocation - o.spending;
  const prevNet = o.prevAllocation - o.prevSpending;
  const rate = o.income > 0 ? ((o.income - o.spending) / o.income) * 100 : 0;
  const prevRate = o.prevIncome > 0 ? ((o.prevIncome - o.prevSpending) / o.prevIncome) * 100 : 0;
  const pts = rate - prevRate;
  return [
    { label: `Net balance · ${o.monthLabel}`, ...money(net), ...deltaOf(net, prevNet, true) },
    { label: "Income", ...money(o.income), ...deltaOf(o.income, o.prevIncome, true) },
    { label: "Spending", ...money(o.spending), ...deltaOf(o.spending, o.prevSpending, false) },
    {
      label: "Savings rate",
      value: Math.round(rate).toString(),
      cents: "%",
      delta: (pts >= 0 ? "+" : "") + pts.toFixed(1) + "pts",
      dir: pts >= 0 ? "pos" : "neg",
      sub: o.prevIncome > 0 ? "vs last month" : "this month",
    },
  ];
}

function OverviewTab({
  expenses,
  categories,
  overview,
  weekly,
}: {
  expenses: Expense[];
  categories: Category[];
  overview: MonthlyOverview;
  weekly: WeeklyBar[];
}) {
  const stats = buildStats(overview);
  const maxWeek = Math.max(1, ...weekly.map((w) => w.total));
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  return (
    <>
      <section className="dash-stats">
        {stats.map((s) => (
          <StatCard key={s.label} s={s} />
        ))}
      </section>

      <section className="dash-grid">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <h2>Spending</h2>
            <span className="meta">Last {weekly.length} weeks</span>
          </div>
          <div className="dash-chart">
            {weekly.map((w, i) => {
              const on = i === weekly.length - 1; // current week
              const h = w.total > 0 ? Math.max(4, (w.total / maxWeek) * 100) : 0;
              return (
                <div key={w.label} className={"dash-bar" + (on ? " on" : "")}>
                  <span className="v">{w.total > 0 ? fmtCompact(w.total) : ""}</span>
                  <div className="track">
                    <div className="fill" style={{ height: `${h}%` }} title={CUR + fmtMoney(w.total)} />
                  </div>
                  <span className="m">{w.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dash-panel">
          <div className="dash-panel-head">
            <h2>Budgets</h2>
            <span className="meta">{overview.monthLabel}</span>
          </div>
          {overview.budgets.length === 0 ? (
            <p className="dash-cat-empty">
              No spending yet. Log an expense and its category shows up here.
            </p>
          ) : (
            overview.budgets.map((b) => {
              const hasLimit = b.limit > 0;
              // With a limit: spent/limit + over/warn colors. Without: share of
              // this month's total spending, neutral bar.
              const p = hasLimit
                ? pct(b.spent, b.limit)
                : pct(b.spent, overview.spending || b.spent);
              const cls = hasLimit ? (p >= 100 ? "over" : p >= 85 ? "warn" : "") : "";
              return (
                <div className="dash-budget" key={b.name}>
                  <div className="top">
                    <span className="name">{b.name}</span>
                    <span className="nums">
                      <b>{CUR}{fmtMoney(b.spent)}</b>
                      {hasLimit && <> / {CUR}{fmtMoney(b.limit)}</>}
                    </span>
                  </div>
                  <div className="dash-meter">
                    <div className={"bar " + cls} style={{ width: `${p}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="dash-panel" style={{ marginTop: 16 }}>
        <div className="dash-panel-head">
          <h2>Recent expenses</h2>
          <span className="meta">{expenses.length} total</span>
        </div>
        {expenses.length === 0 ? (
          <p className="dash-cat-empty">No expenses yet. Hit “Add expense” to log one.</p>
        ) : (
          <div className="dash-list">
            {expenses.map((e) => (
              <ExpenseRow key={e.id} e={e} onEdit={setEditingExpense} />
            ))}
          </div>
        )}
      </section>

      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          categories={categories}
          onClose={() => setEditingExpense(null)}
        />
      )}
    </>
  );
}

function ExpenseRow({ e, onEdit }: { e: Expense; onEdit: (e: Expense) => void }) {
  const color = ICON_COLOR[e.category_icon ?? "tag"] ?? ICON_COLOR.tag;
  const [, action, pending] = useActionState(
    async (_: ActionResult, fd: FormData) => deleteExpense(fd),
    {} as ActionResult,
  );
  return (
    <div className="dash-tx" style={{ opacity: pending ? 0.5 : 1 }}>
      <span className="icon" style={{ color }}>
        <CatIcon icon={e.category_icon ?? "tag"} />
      </span>
      <span className="nm">{e.note || e.category_name || "Expense"}</span>
      <span className="cat">
        {e.category_name ?? "Uncategorized"} · {fmtDate(e.spent_at)}
      </span>
      <span className="amt">−{CUR}{fmtMoney(e.amount)}</span>
      <span className="dash-tx-acts">
        <button className="dash-cat-del" type="button" aria-label="Edit expense" onClick={() => onEdit(e)}>
          <EditIcon />
        </button>
        <form action={action}>
          <input type="hidden" name="id" value={e.id} />
          <button className="dash-cat-del" type="submit" aria-label="Delete expense" disabled={pending}>
            <TrashIcon />
          </button>
        </form>
      </span>
    </div>
  );
}

// Single-form edit for an existing expense (category, date, amount, note).
function EditExpenseModal({
  expense,
  categories,
  onClose,
}: {
  expense: Expense;
  categories: Category[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(
    async (_: ActionResult, fd: FormData) => updateExpense(fd),
    {} as ActionResult,
  );

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <div className="dash-modal-back" onMouseDown={onClose}>
      <div className="dash-modal" onMouseDown={(ev) => ev.stopPropagation()}>
        <div className="dash-modal-head">
          <h2>Edit expense</h2>
          <button type="button" className="dash-modal-x" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <form action={action} className="dash-modal-form">
          <input type="hidden" name="id" value={expense.id} />

          <label className="dash-field">
            <span>Category</span>
            <select name="category_id" defaultValue={expense.category_id ?? ""} required>
              <option value="" disabled>
                Pick a category
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="dash-field">
            <span>Date</span>
            <input name="spent_at" type="date" defaultValue={expense.spent_at} max={todayISO()} />
          </label>

          <label className="dash-field">
            <span>Amount</span>
            <input
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              required
              defaultValue={expense.amount}
            />
          </label>

          <label className="dash-field">
            <span>Note</span>
            <input name="note" type="text" maxLength={120} placeholder="Optional" defaultValue={expense.note ?? ""} />
          </label>

          {state.error && <p className="dash-modal-err">{state.error}</p>}

          <div className="dash-modal-foot">
            <button type="button" className="dash-btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="dash-btn" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13" />
  </svg>
);
const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
);
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

function CategoryRow({ c, onEdit }: { c: Category; onEdit: (c: Category) => void }) {
  const color = ICON_COLOR[c.icon] ?? ICON_COLOR.tag;
  const [, action, pending] = useActionState(
    async (_: ActionResult, fd: FormData) => deleteCategory(fd),
    {} as ActionResult,
  );
  return (
    <div className="dash-cat" style={{ opacity: pending ? 0.5 : 1 }}>
      <span className="icon" style={{ color }}>
        <CatIcon icon={c.icon} />
      </span>
      <div className="body">
        <div className="name">{c.name}</div>
        {c.description && <div className="desc">{c.description}</div>}
      </div>
      <div className="right">
        {c.is_default && <span className="tag-default">Default</span>}
        {c.monthly_limit > 0 && (
          <span className="dash-cat-limit">
            {CUR}
            {fmtMoney(c.monthly_limit)}
          </span>
        )}
        <button
          className="dash-cat-del"
          type="button"
          aria-label={`Edit ${c.name}`}
          onClick={() => onEdit(c)}
        >
          <EditIcon />
        </button>
        {!c.is_default && (
          <form action={action}>
            <input type="hidden" name="id" value={c.id} />
            <button className="dash-cat-del" type="submit" aria-label={`Delete ${c.name}`} disabled={pending}>
              <TrashIcon />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// Create or edit a category. Pass `category` to edit (prefills + updates).
function CategoryModal({ category, onClose }: { category?: Category; onClose: () => void }) {
  const editing = !!category;
  const initIcon = (ICON_KEYS as readonly string[]).includes(category?.icon ?? "")
    ? (category!.icon as IconKey)
    : "tag";
  const [icon, setIcon] = useState<IconKey>(initIcon);
  const [state, action, pending] = useActionState(
    async (_: ActionResult, fd: FormData) => (editing ? updateCategory(fd) : createCategory(fd)),
    {} as ActionResult,
  );

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <div className="dash-modal-back" onMouseDown={onClose}>
      <div className="dash-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="dash-modal-head">
          <h2>{editing ? "Edit category" : "New category"}</h2>
          <button type="button" className="dash-modal-x" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <form action={action} className="dash-modal-form">
          <input type="hidden" name="icon" value={icon} />
          {editing && <input type="hidden" name="id" value={category!.id} />}

          <label className="dash-field">
            <span>Name</span>
            <input
              name="name"
              type="text"
              required
              maxLength={40}
              placeholder="e.g. Subscriptions"
              defaultValue={category?.name ?? ""}
              autoFocus
            />
          </label>

          <label className="dash-field">
            <span>Description</span>
            <input
              name="description"
              type="text"
              maxLength={120}
              placeholder="Optional"
              defaultValue={category?.description ?? ""}
            />
          </label>

          <label className="dash-field">
            <span>Monthly limit</span>
            <input
              name="monthly_limit"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="Optional — shows in Budgets"
              defaultValue={category && category.monthly_limit > 0 ? category.monthly_limit : ""}
            />
          </label>

          <div className="dash-field">
            <span>Icon</span>
            <div className="dash-icon-pick">
              {ICON_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={"dash-icon-opt" + (icon === k ? " on" : "")}
                  style={{ color: ICON_COLOR[k] }}
                  onClick={() => setIcon(k)}
                  aria-label={k}
                  aria-pressed={icon === k}
                >
                  <CatIcon icon={k} />
                </button>
              ))}
            </div>
          </div>

          {state.error && <p className="dash-modal-err">{state.error}</p>}

          <div className="dash-modal-foot">
            <button type="button" className="dash-btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="dash-btn" disabled={pending}>
              {pending ? "Saving…" : editing ? "Save" : "Add category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

const STEPS = ["Category", "Date", "Amount"] as const;

// local YYYY-MM-DD for the date input default (avoids UTC shift from toISOString).
function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function AddExpenseModal({
  categories,
  onClose,
}: {
  categories: Category[];
  onClose: () => void;
}) {
  const [step, setStep] = useState(0); // 0 category, 1 date, 2 amount
  const [categoryId, setCategoryId] = useState("");
  const [spentAt, setSpentAt] = useState(todayISO());
  const [state, action, pending] = useActionState(
    async (_: ActionResult, fd: FormData) => createExpense(fd),
    {} as ActionResult,
  );

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  const selected = categories.find((c) => c.id === categoryId);

  return (
    <div className="dash-modal-back" onMouseDown={onClose}>
      <div className="dash-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="dash-modal-head">
          <h2>Add expense</h2>
          <button type="button" className="dash-modal-x" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="dash-steps">
          {STEPS.map((label, i) => (
            <div key={label} className={"dash-step" + (i === step ? " on" : i < step ? " done" : "")}>
              <span className="dot">{i + 1}</span>
              {label}
            </div>
          ))}
        </div>

        <form action={action} className="dash-modal-form">
          <input type="hidden" name="category_id" value={categoryId} />
          <input type="hidden" name="spent_at" value={spentAt} />

          {step === 0 && (
            <div className="dash-field">
              <span>Category</span>
              {categories.length === 0 ? (
                <p className="dash-cat-empty">Add a category first.</p>
              ) : (
                <div className="dash-exp-cats">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={"dash-exp-cat" + (categoryId === c.id ? " on" : "")}
                      onClick={() => {
                        setCategoryId(c.id);
                        setStep(1);
                      }}
                    >
                      <span className="icon" style={{ color: ICON_COLOR[c.icon] ?? ICON_COLOR.tag }}>
                        <CatIcon icon={c.icon} />
                      </span>
                      <span className="nm">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <label className="dash-field">
              <span>Date</span>
              <input
                name="spent_at_visible"
                type="date"
                value={spentAt}
                max={todayISO()}
                onChange={(e) => setSpentAt(e.target.value)}
                autoFocus
              />
            </label>
          )}

          {step === 2 && (
            <>
              <label className="dash-field">
                <span>Amount</span>
                <input
                  name="amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  autoFocus
                />
              </label>
              <label className="dash-field">
                <span>Note</span>
                <input name="note" type="text" maxLength={120} placeholder="Optional" />
              </label>
              <div className="dash-exp-summary">
                {selected?.name} · {spentAt}
              </div>
            </>
          )}

          {state.error && <p className="dash-modal-err">{state.error}</p>}

          <div className="dash-modal-foot">
            {step > 0 ? (
              <button type="button" className="dash-btn ghost" onClick={() => setStep(step - 1)}>
                <BackIcon />
                Back
              </button>
            ) : (
              <button type="button" className="dash-btn ghost" onClick={onClose}>
                Cancel
              </button>
            )}

            {step === 1 && (
              <button type="button" className="dash-btn" onClick={() => setStep(2)} disabled={!spentAt}>
                Next
              </button>
            )}
            {step === 2 && (
              <button type="submit" className="dash-btn" disabled={pending}>
                {pending ? "Adding…" : "Add expense"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function BudgetModal({ overview, onClose }: { overview: MonthlyOverview; onClose: () => void }) {
  const [state, action, pending] = useActionState(
    async (_: ActionResult, fd: FormData) => setMonthlyBudget(fd),
    {} as ActionResult,
  );

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  // New month with no saved row → carry last month's figures as editable
  // defaults (not yet saved until the user confirms).
  const carried = !overview.isSet && (overview.prevIncome > 0 || overview.prevAllocation > 0);
  const incomeDefault = overview.isSet ? overview.income : overview.prevIncome;
  const allocationDefault = overview.isSet ? overview.allocation : overview.prevAllocation;

  return (
    <div className="dash-modal-back" onMouseDown={onClose}>
      <div className="dash-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="dash-modal-head">
          <h2>Income &amp; balance · {overview.monthLabel}</h2>
          <button type="button" className="dash-modal-x" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <form action={action} className="dash-modal-form">
          <label className="dash-field">
            <span>Income</span>
            <input
              name="income"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              defaultValue={incomeDefault || ""}
              placeholder="0.00"
              autoFocus
            />
          </label>

          <label className="dash-field">
            <span>Net balance (allocated to spend)</span>
            <input
              name="allocation"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              defaultValue={allocationDefault || ""}
              placeholder="0.00"
            />
          </label>

          <p className="dash-exp-summary">
            {carried
              ? "Carried over from last month — edit and save to confirm for this month."
              : "Remaining net balance = allocation minus expenses logged this month."}
          </p>

          {state.error && <p className="dash-modal-err">{state.error}</p>}

          <div className="dash-modal-foot">
            <button type="button" className="dash-btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="dash-btn" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoriesTab({
  categories,
  onAdd,
  onEdit,
}: {
  categories: Category[];
  onAdd: () => void;
  onEdit: (c: Category) => void;
}) {
  return (
    <section className="dash-panel">
      <div className="dash-cat-head">
        <span className="label">{categories.length} categories</span>
        <button type="button" className="dash-btn sm" onClick={onAdd}>
          <PlusIcon />
          Add category
        </button>
      </div>
      {categories.map((c) => (
        <CategoryRow key={c.id} c={c} onEdit={onEdit} />
      ))}
      {categories.length === 0 && <p className="dash-cat-empty">No categories yet.</p>}
    </section>
  );
}

const TABS = ["Overview", "Categories"] as const;
type Tab = (typeof TABS)[number];

/** Quiet Money dashboard with Overview / Categories tabs. */
export function Dashboard({
  email,
  categories,
  expenses,
  overview,
  weekly,
}: {
  email: string;
  categories: Category[];
  expenses: Expense[];
  overview: MonthlyOverview;
  weekly: WeeklyBar[];
}) {
  void email; // shown in the top bar; greeting kept generic
  const [tab, setTab] = useState<Tab>("Overview");
  const [adding, setAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [addingExpense, setAddingExpense] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);

  return (
    <div className="dash">
      <div className="dash-wrap">
        <header className="dash-head">
          <div>
            <h1 className="dash-h1">Dashboard</h1>
            <p className="dash-sub">Welcome back — here&apos;s your money this month.</p>
          </div>
          <div className="dash-actions">
            <button className="dash-chip" type="button" onClick={() => setEditingBudget(true)}>
              <span className="ic">
                <WalletIcon />
              </span>
              Income &amp; balance
            </button>
            <button className="dash-btn" type="button" onClick={() => setAddingExpense(true)}>
              <PlusIcon />
              Add expense
            </button>
          </div>
        </header>

        <nav className="dash-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={"dash-tab" + (tab === t ? " on" : "")}
              onClick={() => setTab(t)}
            >
              {t}
              {t === "Categories" && <span className="count">{categories.length}</span>}
            </button>
          ))}
        </nav>

        {tab === "Overview" ? (
          <OverviewTab
            expenses={expenses}
            categories={categories}
            overview={overview}
            weekly={weekly}
          />
        ) : (
          <CategoriesTab
            categories={categories}
            onAdd={() => setAdding(true)}
            onEdit={(c) => setEditingCategory(c)}
          />
        )}
      </div>

      {adding && <CategoryModal onClose={() => setAdding(false)} />}
      {editingCategory && (
        <CategoryModal category={editingCategory} onClose={() => setEditingCategory(null)} />
      )}
      {addingExpense && (
        <AddExpenseModal categories={categories} onClose={() => setAddingExpense(false)} />
      )}
      {editingBudget && (
        <BudgetModal overview={overview} onClose={() => setEditingBudget(false)} />
      )}
    </div>
  );
}
