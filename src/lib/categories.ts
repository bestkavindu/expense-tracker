// Category model shared between server actions and the dashboard UI.
// Icons are referenced by key here (string); the SVG lives in the client
// component's icon registry so this file stays server-safe.

export type Category = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  is_default: boolean;
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
