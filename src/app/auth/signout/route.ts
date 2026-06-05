import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");

  // 303 forces a GET on the redirect target after the POST.
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
