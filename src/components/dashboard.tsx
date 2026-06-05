import "./dashboard.css";

/* --- inline icons, stroke style matches quiet-auth --- */
const Ic = ({ d, children }: { d?: string; children?: React.ReactNode }) => (
  <svg
    className="ic"
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {d ? <path d={d} /> : children}
  </svg>
);

const PlusIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const CalendarIcon = () => (
  <Ic>
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9h18M8 2.5v4M16 2.5v4" />
  </Ic>
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

// [name, spent, limit]
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

/** Quiet Money dashboard. `email` shown in the greeting eyebrow. */
export function Dashboard({ email }: { email: string }) {
  return (
    <div className="dash">
      <div className="dash-wrap">
        <header className="dash-head">
          <div>
            <div className="dash-eyebrow">{email}</div>
            <h1 className="dash-h1">Overview</h1>
          </div>
          <div className="dash-actions">
            <button className="dash-chip" type="button">
              <CalendarIcon />
              June 2026
            </button>
            <button className="dash-btn" type="button">
              <PlusIcon />
              Add expense
            </button>
          </div>
        </header>

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
      </div>
    </div>
  );
}
