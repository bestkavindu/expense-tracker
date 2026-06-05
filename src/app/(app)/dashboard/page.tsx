import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Dashboard } from "@/components/dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <Dashboard email={user.email ?? ""} />;
}
