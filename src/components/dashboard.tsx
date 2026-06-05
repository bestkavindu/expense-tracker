"use client";

import { useActionState, useEffect, useState } from "react";
import { createCategory, deleteCategory, type ActionResult } from "@/app/(app)/dashboard/actions";
import { ICON_KEYS, type Category, type IconKey } from "@/lib/categories";
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

/* --- sample data (UI only — wiring to Supabase comes later) --- */
type Stat = { label: string; value: string; cents?: string; delta: string; sub: string; dir: "pos" | "neg" };
const STATS: Stat[] = [
  { label: "Net balance · June", value: "$12,480", cents: ".50", delta: "8.2%", sub: "vs last month", dir: "pos" },
  { label: "Income", value: "$4,200", cents: ".00", delta: "0.0%", sub: "vs last month", dir: "pos" },
  { label: "Spending", value: "$1,860", cents: ".40", delta: "12.4%", sub: "vs last month", dir: "neg" },
  { label: "Savings rate", value: "56", cents: "%", delta: "3.1pts", sub: "vs last month", dir: "pos" },
];

// [month, height%, active]
const CHART: [string, number, boolean][] = [
  ["Jan", 48, false],
  ["Feb", 62, false],
  ["Mar", 41, false],
  ["Apr", 73, false],
  ["May", 55, false],
  ["Jun", 90, true],
];

// [dotColor, name, category, amount, positive]
const TX: [string, string, string, string, boolean][] = [
  ["#74e3b4", "Salary — Studio Inc", "Income", "+4,200.00", true],
  ["#8b93a1", "Whole Foods Market", "Groceries", "−86.40", false],
  ["#8b93a1", "Figma Annual", "Software", "−144.00", false],
  ["#8b93a1", "Blue Bottle Coffee", "Dining", "−6.75", false],
  ["#8b93a1", "Uber", "Transport", "−18.20", false],
];

// monthly budget caps for Overview tab. [name, spent, limit]
const BUDGETS: [string, number, number][] = [
  ["Groceries", 312, 500],
  ["Dining", 188, 250],
  ["Software", 144, 150],
  ["Transport", 96, 120],
];

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

function OverviewTab() {
  return (
    <>
      <section className="dash-stats">
        {STATS.map((s) => (
          <StatCard key={s.label} s={s} />
        ))}
      </section>

      <section className="dash-grid">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <h2>Spending</h2>
            <span className="meta">Last 6 months</span>
          </div>
          <div className="dash-chart">
            {CHART.map(([m, h, on]) => (
              <div key={m} className={"dash-bar" + (on ? " on" : "")}>
                <div className="track">
                  <div className="fill" style={{ height: `${h}%` }} />
                </div>
                <span className="m">{m}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-panel">
          <div className="dash-panel-head">
            <h2>Budgets</h2>
            <span className="meta">June</span>
          </div>
          {BUDGETS.map(([name, spent, limit]) => {
            const p = pct(spent, limit);
            const cls = p >= 100 ? "over" : p >= 85 ? "warn" : "";
            return (
              <div className="dash-budget" key={name}>
                <div className="top">
                  <span className="name">{name}</span>
                  <span className="nums">
                    <b>${spent}</b> / ${limit}
                  </span>
                </div>
                <div className="dash-meter">
                  <div className={"bar " + cls} style={{ width: `${p}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="dash-panel" style={{ marginTop: 16 }}>
        <div className="dash-panel-head">
          <h2>Recent transactions</h2>
          <span className="meta">{TX.length} this week</span>
        </div>
        <div className="dash-list">
          {TX.map((t, i) => (
            <div className="dash-tx" key={i}>
              <span className="dot" style={{ background: t[0] }} />
              <span className="nm">{t[1]}</span>
              <span className="cat">{t[2]}</span>
              <span className={"amt" + (t[4] ? " pos" : "")}>{t[3]}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13" />
  </svg>
);
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

function CategoryRow({ c }: { c: Category }) {
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
        {c.is_default ? (
          <span className="tag-default">Default</span>
        ) : (
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

function AddCategoryModal({ onClose }: { onClose: () => void }) {
  const [icon, setIcon] = useState<IconKey>("tag");
  const [state, action, pending] = useActionState(
    async (_: ActionResult, fd: FormData) => createCategory(fd),
    {} as ActionResult,
  );

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <div className="dash-modal-back" onMouseDown={onClose}>
      <div className="dash-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="dash-modal-head">
          <h2>New category</h2>
          <button type="button" className="dash-modal-x" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <form action={action} className="dash-modal-form">
          <input type="hidden" name="icon" value={icon} />

          <label className="dash-field">
            <span>Name</span>
            <input name="name" type="text" required maxLength={40} placeholder="e.g. Subscriptions" autoFocus />
          </label>

          <label className="dash-field">
            <span>Description</span>
            <input name="description" type="text" maxLength={120} placeholder="Optional" />
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
              {pending ? "Adding…" : "Add category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoriesTab({ categories, onAdd }: { categories: Category[]; onAdd: () => void }) {
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
        <CategoryRow key={c.id} c={c} />
      ))}
      {categories.length === 0 && <p className="dash-cat-empty">No categories yet.</p>}
    </section>
  );
}

const TABS = ["Overview", "Categories"] as const;
type Tab = (typeof TABS)[number];

/** Quiet Money dashboard with Overview / Categories tabs. */
export function Dashboard({ email, categories }: { email: string; categories: Category[] }) {
  void email; // shown in the top bar; greeting kept generic
  const [tab, setTab] = useState<Tab>("Overview");
  const [adding, setAdding] = useState(false);

  return (
    <div className="dash">
      <div className="dash-wrap">
        <header className="dash-head">
          <div>
            <h1 className="dash-h1">Dashboard</h1>
            <p className="dash-sub">Welcome back — here&apos;s your money this month.</p>
          </div>
          <div className="dash-actions">
            <button className="dash-btn" type="button">
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
          <OverviewTab />
        ) : (
          <CategoriesTab categories={categories} onAdd={() => setAdding(true)} />
        )}
      </div>

      {adding && <AddCategoryModal onClose={() => setAdding(false)} />}
    </div>
  );
}
