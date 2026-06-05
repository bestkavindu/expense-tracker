import Link from "next/link";
import { signup } from "../login/actions";
import {
  QuietAuthShell,
  Field,
  Checkbox,
  MailIcon,
  LockIcon,
  UserIcon,
  EyeIcon,
} from "@/components/quiet-auth";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <QuietAuthShell>
      <div className="qm-eyebrow">Get started</div>
      <h1 className="qm-h1">
        Create your
        <br />
        account.
      </h1>
      <p className="qm-sub">Free to start. No card required.</p>

      <form>
        {error && <p className="qm-alert err">{error}</p>}
        {message && <p className="qm-alert ok">{message}</p>}

        <Field
          label="Full name"
          name="full_name"
          icon={<UserIcon />}
          placeholder="Alex Rivera"
          autoComplete="name"
          required
        />
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
          placeholder="At least 8 characters"
          autoComplete="new-password"
          minLength={8}
          required
          trailing={<EyeIcon />}
        />

        <div className="qm-row" style={{ margin: "6px 0 26px" }}>
          <Checkbox>I agree to the Terms &amp; Privacy</Checkbox>
        </div>

        <button className="qm-btn" formAction={signup}>
          Create account
        </button>
      </form>

      <div className="qm-foot">
        Already have an account?{" "}
        <Link className="qm-link" href="/login">
          Log in
        </Link>
      </div>
    </QuietAuthShell>
  );
}
