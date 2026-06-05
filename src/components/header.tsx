import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <Link href="/" className="font-semibold">
        Expense Tracker
      </Link>

      <nav className="flex items-center gap-3">
        {user ? (
          <>
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </>
        ) : (
          <Button render={<Link href="/login" />} variant="outline" size="sm">
            Sign in
          </Button>
        )}
      </nav>
    </header>
  );
}
