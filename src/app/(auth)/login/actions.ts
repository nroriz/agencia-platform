"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Get user role to redirect properly
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Erro ao buscar usuario" };
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("role")
    .eq("auth_id", user.id)
    .single();

  if (dbUser?.role === "client") {
    redirect("/client");
  }

  redirect("/admin");
}
