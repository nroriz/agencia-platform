import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Use internal HTTP URL for server-side to avoid TLS cert issues in Docker
  const supabaseUrl = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const supabase = createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublicRoute =
    pathname.startsWith("/login") || pathname.startsWith("/auth");

  // Never intercept the signout route — let it handle POST directly
  if (pathname === "/auth/signout") {
    return supabaseResponse;
  }

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login — route by role
  if (user && isPublicRoute) {
    const { data: dbUser } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", user.id)
      .single();

    const url = request.nextUrl.clone();
    url.pathname = dbUser?.role === "client" ? "/client" : "/admin";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
