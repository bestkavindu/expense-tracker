import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Dashboard } from "@/components/dashboard";
import { getCategories, getExpenses, getOverview, getWeeklySpending } from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const categories = await getCategories();
  const expenses = await getExpenses();
  const overview = await getOverview();
  const weekly = await getWeeklySpending();

  return (
    <Dashboard
      email={user.email ?? ""}
      categories={categories}
      expenses={expenses}
      overview={overview}
      weekly={weekly}
    />
  );
}
