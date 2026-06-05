"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  DEFAULT_CATEGORIES,
  ICON_KEYS,
  type Category,
  type IconKey,
} from "@/lib/categories";

const SELECT = "id, name, description, icon, is_default";

// Fetch the signed-in user's categories. On first load (none yet) seed the
// defaults, then return the fresh list. Always scoped to the current user.
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("categories")
    .select(SELECT)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  if (data && data.length > 0) return data as Category[];

  // Seed defaults for this user.
  const seed = DEFAULT_CATEGORIES.map((c) => ({
    user_id: user.id,
    name: c.name,
    description: c.description,
    icon: c.icon,
    is_default: true,
  }));
  const { data: seeded, error: seedErr } = await supabase
    .from("categories")
    .insert(seed)
    .select(SELECT);
  if (seedErr) throw new Error(seedErr.message);

  return (seeded ?? []) as Category[];
}

export type ActionResult = { error?: string; ok?: boolean };

export async function createCategory(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const iconRaw = String(formData.get("icon") ?? "tag");
  const icon: IconKey = (ICON_KEYS as readonly string[]).includes(iconRaw)
    ? (iconRaw as IconKey)
    : "tag";

  if (!name) return { error: "Name is required." };

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name,
    description: description || null,
    icon,
    is_default: false,
  });
  if (error) {
    // Unique index → duplicate name.
    if (error.code === "23505") return { error: "A category with that name exists." };
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteCategory(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing category id." };

  // RLS already scopes to the owner; default rows are protected too.
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("is_default", false);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return {};
}
