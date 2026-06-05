import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Dashboard } from "@/components/dashboard";
import { getCategories } from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const categories = await getCategories();

  return <Dashboard email={user.email ?? ""} categories={categories} />;
}
