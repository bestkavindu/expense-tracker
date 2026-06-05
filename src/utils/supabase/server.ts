import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase client for Server Components, Server Actions, and Route Handlers.
// cookies() is async in Next.js 16, so this factory is async too.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component where cookies cannot be set.
            // Safe to ignore — the proxy refreshes the session on each request.
          }
        },
      },
    },
  );
}
