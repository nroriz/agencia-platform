import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User } from "@/types/database";

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", authUser.id)
    .single();

  return dbUser as User | null;
}

export async function requireAuth(): Promise<User> {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  if (user.role !== "admin") redirect("/client");
  return user;
}

export async function requireClient(): Promise<User> {
  const user = await requireAuth();
  if (user.role !== "client") redirect("/admin");
  return user;
}
