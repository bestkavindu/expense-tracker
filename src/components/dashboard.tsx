"use client";

import { useState } from "react";
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

type Category = { name: string; amount: number; pct: number; color: string; icon: React.ReactNode };
const CATEGORIES: Category[] = [
  { name: "Housing", amount: 1280.0, pct: 40, color: "#7aa2f7", icon: <HomeIcon /> },
  { name: "Food & Dining", amount: 642.4, pct: 20, color: "#74e3b4", icon: <FoodIcon /> },
  { name: "Transport", amount: 418.0, pct: 13, color: "#e8c468", icon: <CarIcon /> },
  { name: "Shopping", amount: 386.5, pct: 12, color: "#a78bfa", icon: <BagIcon /> },
  { name: "Software", amount: 300.0, pct: 9, color: "#5ec8d8", icon: <CodeIcon /> },
  { name: "Health", amount: 191.5, pct: 6, color: "#f7768e", icon: <HeartIcon /> },
];
const CAT_TOTAL = CATEGORIES.reduce((s, c) => s + c.amount, 0);

const money = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

function CategoriesTab() {
  return (
    <section className="dash-panel">
      <div className="dash-cat-head">
        <span className="label">Total spent · June</span>
        <span className="total">${money(CAT_TOTAL)}</span>
      </div>
      {CATEGORIES.map((c) => (
        <div className="dash-cat" key={c.name}>
          <span className="icon" style={{ color: c.color }}>
            {c.icon}
          </span>
          <div className="body">
            <div className="name">{c.name}</div>
            <div className="dash-cat-meter">
              <div className="bar" style={{ width: `${c.pct}%`, background: c.color }} />
            </div>
          </div>
          <div className="right">
            <div className="amt">${money(c.amount)}</div>
            <div className="pct">{c.pct}% of spend</div>
          </div>
        </div>
      ))}
    </section>
  );
}

const TABS = ["Overview", "Categories"] as const;
type Tab = (typeof TABS)[number];

/** Quiet Money dashboard with Overview / Categories tabs. */
export function Dashboard({ email }: { email: string }) {
  void email; // shown in the top bar; greeting kept generic
  const [tab, setTab] = useState<Tab>("Overview");

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
              {t === "Categories" && <span className="count">{CATEGORIES.length}</span>}
            </button>
          ))}
        </nav>

        {tab === "Overview" ? <OverviewTab /> : <CategoriesTab />}
      </div>
    </div>
  );
}
