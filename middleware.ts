import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PLACEHOLDER_VALUES = new Set(["your-supabase-url", "your-anon-key", "", undefined]);

function isSupabaseConfigured(): boolean {
  return (
    !PLACEHOLDER_VALUES.has(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !PLACEHOLDER_VALUES.has(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

// This dashboard holds private operational data for Whitehouse Property Group's venues, so
// every route requires a signed-in session except /login itself. If
// Supabase isn't configured yet (e.g. a fresh local checkout with no env
// vars), auth is skipped entirely rather than locking the app out.
export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login";
  const isApiRoute = pathname.startsWith("/api/");

  if (!user && !isLoginPage) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except Next internals and static files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
