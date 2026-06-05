import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// Next.js 16 renamed `middleware` → `proxy` (runs on the nodejs runtime).
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static asset files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
