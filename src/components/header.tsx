import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Mark } from "@/components/quiet-auth";
import "./header.css";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="tally-bar">
      <Link href="/" className="tally-brand">
        <Mark size={22} />
        <b>Tally</b>
      </Link>

      <nav className="tally-nav">
        {user ? (
          <>
            <span className="tally-email">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="tally-signout">
                Sign out
              </button>
            </form>
          </>
        ) : (
          <Link href="/login" className="tally-signin">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
