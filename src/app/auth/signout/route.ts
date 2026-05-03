import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  // Try to sign out via Supabase (may fail due to TLS in Docker)
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore — we'll clear cookies manually below
  }

  // Always clear all Supabase auth cookies to force logout
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const response = NextResponse.json({ ok: true });

  for (const cookie of allCookies) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.set(cookie.name, "", { maxAge: 0, path: "/" });
    }
  }

  return response;
}
