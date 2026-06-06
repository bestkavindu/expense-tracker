import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Dashboard } from "@/components/dashboard";
import {
  getCategories,
  getExpenses,
  getMonthlySpending,
  getOverview,
  getWeeklySpending,
} from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const categories = await getCategories();
  const expenses = await getExpenses(10);
  const overview = await getOverview();
  const weekly = await getWeeklySpending();
  const monthly = await getMonthlySpending();

  return (
    <Dashboard
      email={user.email ?? ""}
      categories={categories}
      expenses={expenses}
      overview={overview}
      weekly={weekly}
      monthly={monthly}
    />
  );
}
