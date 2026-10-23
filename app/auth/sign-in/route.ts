import { NextResponse, type NextRequest } from "next/server";
import { createClient, getSession, googleEnabled, supabaseConfigured } from "@/lib/supabase/server";

/**
 * Every "Try Nexus free" and "Sign in" link lands here. Signed in already: straight to the dashboard.
 * Otherwise start Google OAuth through Supabase (PKCE), or explain on /sign-in why it cannot start.
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;

  if (!supabaseConfigured()) return NextResponse.redirect(`${origin}/sign-in?error=not-configured`);
  if (await getSession()) return NextResponse.redirect(`${origin}/dashboard`);
  if (!(await googleEnabled())) return NextResponse.redirect(`${origin}/sign-in?error=google-not-configured`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=/dashboard`, skipBrowserRedirect: true },
  });
  if (error || !data.url) return NextResponse.redirect(`${origin}/sign-in?error=oauth-start`);

  return NextResponse.redirect(data.url);
}
