// Category model shared between server actions and the dashboard UI.
// Icons are referenced by key here (string); the SVG lives in the client
// component's icon registry so this file stays server-safe.

export type Category = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  is_default: boolean;
  monthly_limit: number; // 0 = no limit; drives the Budgets card
};

// One bar of the weekly Spending chart: a week's total spend.
export type WeeklyBar = {
  label: string; // week-start, e.g. "Jun 2"
  total: number;
};

// One row of the Budgets card: a category's spend this month vs its limit.
export type BudgetRow = {
  name: string;
  icon: string;
  spent: number;
  limit: number;
};

// A spend entry with its category name/icon resolved (or null if the
// category was deleted). spent_at is a YYYY-MM-DD date string.
export type Expense = {
  id: string;
  amount: number;
  spent_at: string;
  note: string | null;
  category_name: string | null;
  category_icon: string | null;
};

// Current-month money figures for the Overview stat cards, plus the prior
// month for deltas. `allocation` is the net balance the user set; remaining
// net balance = allocation - spending.
export type MonthlyOverview = {
  monthLabel: string;
  isSet: boolean; // true once the user saves income/allocation for this month
  income: number;
  allocation: number;
  spending: number;
  prevIncome: number;
  prevAllocation: number;
  prevSpending: number;
  budgets: BudgetRow[]; // per-category spend vs limit, current month
};

// Icon keys with a matching SVG in the dashboard icon registry.
export const ICON_KEYS = [
  "food",
  "transport",
  "bills",
  "shopping",
  "travel",
  "home",
  "software",
  "health",
  "tag",
] as const;

export type IconKey = (typeof ICON_KEYS)[number];

// Seeded once per user on first load. is_default rows can't be deleted in UI.
export const DEFAULT_CATEGORIES: {
  name: string;
  description: string;
  icon: IconKey;
}[] = [
  { name: "Food & Drinking", description: "Restaurants, groceries, cafés", icon: "food" },
  { name: "Transport", description: "Fuel, transit, rideshare", icon: "transport" },
  { name: "Bills", description: "Utilities, rent, subscriptions", icon: "bills" },
  { name: "Shopping", description: "Retail and online purchases", icon: "shopping" },
  { name: "Travel", description: "Flights, hotels, trips", icon: "travel" },
];
