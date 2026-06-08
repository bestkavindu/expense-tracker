"use client";

import Link from "next/link";
import { useState } from "react";
import "./quiet-auth.css";

export function Mark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="4" y1="5" x2="4" y2="19" />
        <line x1="9" y1="5" x2="9" y2="19" />
        <line x1="14" y1="5" x2="14" y2="19" />
        <line x1="19" y1="5" x2="19" y2="19" />
        <line x1="2" y1="17" x2="21" y2="7" />
      </g>
    </svg>
  );
}

export const MailIcon = () => (
  <svg className="ic" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);

export const LockIcon = () => (
  <svg className="ic" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="4" y="11" width="16" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const UserIcon = () => (
  <svg className="ic" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="8" r="3.4" />
    <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
  </svg>
);

export const EyeIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="2.6" />
  </svg>
);

export const EyeOffIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M2 12s3.5-7 10-7c1.4 0 2.7.3 3.9.8M22 12s-3.5 7-10 7c-1.4 0-2.7-.3-3.9-.8" />
    <path d="M9.9 9.9a2.6 2.6 0 0 0 3.7 3.7" />
    <line x1="3" y1="3" x2="21" y2="21" />
  </svg>
);

const CheckTick = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
    <path d="m5 12 5 5L20 7" />
  </svg>
);

export function Field({
  label,
  name,
  type = "text",
  icon,
  placeholder,
  defaultValue,
  required,
  minLength,
  autoComplete,
  trailing,
}: {
  label: string;
  name: string;
  type?: string;
  icon: React.ReactNode;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  trailing?: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const effectiveType = isPassword && show ? "text" : type;

  return (
    <div className="qm-field">
      <label htmlFor={name}>{label}</label>
      <div className="qm-input">
        {icon}
        <input
          id={name}
          name={name}
          type={effectiveType}
          placeholder={placeholder}
          defaultValue={defaultValue}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
        />
        {isPassword ? (
          <button
            type="button"
            className="qm-eye"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
          >
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        ) : (
          trailing
        )}
      </div>
    </div>
  );
}

export function Checkbox({ children }: { children: React.ReactNode }) {
  return (
    <span className="qm-check">
      <span className="qm-box on">
        <CheckTick />
      </span>
      {children}
    </span>
  );
}

function RightPanel() {
  const tx: [string, string, string, string, boolean][] = [
    ["#74e3b4", "Salary — Studio Inc", "Income", "+4,200.00", true],
    ["#8b93a1", "Whole Foods Market", "Groceries", "−86.40", false],
    ["#8b93a1", "Figma Annual", "Software", "−144.00", false],
    ["#8b93a1", "Blue Bottle Coffee", "Dining", "−6.75", false],
  ];
  return (
    <div className="qm-right">
      <div className="qm-glow" />
      <div className="qm-rlabel">Net balance · June</div>
      <div className="qm-balance">
        $12,480<span className="c">.50</span>
      </div>
      <div className="qm-delta">▲ 8.2% vs last month</div>
      <div className="qm-list">
        {tx.map((t, i) => (
          <div className="qm-tx" key={i}>
            <span className="dot" style={{ background: t[0] }} />
            <span className="nm">{t[1]}</span>
            <span className="cat">{t[2]}</span>
            <span className={"amt" + (t[4] ? " pos" : "")}>{t[3]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full-screen split auth shell. `children` render in the left form column. */
export function QuietAuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="qm">
      <div className="qm-frame">
        <div className="qm-left">
          <Link href="/" className="qm-brand">
            <Mark />
            <b>Tally</b>
          </Link>
          {children}
        </div>
        <RightPanel />
      </div>
    </div>
  );
}
