import Link from "next/link";
import { login } from "./actions";
import {
  QuietAuthShell,
  Field,
  Checkbox,
  MailIcon,
  LockIcon,
  EyeIcon,
} from "@/components/quiet-auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <QuietAuthShell>
      <div className="qm-eyebrow">Welcome back</div>
      <h1 className="qm-h1">
        Log in to your
        <br />
        ledger.
      </h1>
      <p className="qm-sub">Pick up right where you left off.</p>

      <form>
        {error && <p className="qm-alert err">{error}</p>}
        {message && <p className="qm-alert ok">{message}</p>}

        <Field
          label="Email address"
          name="email"
          type="email"
          icon={<MailIcon />}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <Field
          label="Password"
          name="password"
          type="password"
          icon={<LockIcon />}
          placeholder="Your password"
          autoComplete="current-password"
          minLength={6}
          required
          trailing={<EyeIcon />}
        />

        <div className="qm-row">
          <Checkbox>Keep me signed in</Checkbox>
          <Link className="qm-link" href="/login">
            Forgot password?
          </Link>
        </div>

        <button className="qm-btn" formAction={login}>
          Log in
        </button>
      </form>

      <div className="qm-foot">
        New to Tally?{" "}
        <Link className="qm-link" href="/signup">
          Create an account
        </Link>
      </div>
    </QuietAuthShell>
  );
}
