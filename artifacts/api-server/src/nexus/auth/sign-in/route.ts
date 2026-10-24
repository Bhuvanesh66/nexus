import { createClient, getSession, googleEnabled, supabaseConfigured } from "@/lib/supabase/server";

/**
 * Every "Try Nexus free" and "Sign in" link lands here. Signed in already: straight to the dashboard.
 * Otherwise start Google OAuth through Supabase (PKCE), or explain on /sign-in why it cannot start.
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  if (!supabaseConfigured()) return Response.redirect(`${origin}/sign-in?error=not-configured`, 307);
  if (await getSession()) return Response.redirect(`${origin}/dashboard`, 307);
  if (!(await googleEnabled())) return Response.redirect(`${origin}/sign-in?error=google-not-configured`, 307);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=/dashboard`, skipBrowserRedirect: true },
  });
  if (error || !data.url) return Response.redirect(`${origin}/sign-in?error=oauth-start`, 307);

  return Response.redirect(data.url, 307);
}
