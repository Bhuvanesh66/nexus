import { createClient } from "@/lib/supabase/server";

/** Google sends the user back here with a code; exchange it for a session and go on to the app. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return Response.redirect(`${origin}${safeNext}`, 307);
  }

  return Response.redirect(`${origin}/sign-in?error=callback`, 307);
}
