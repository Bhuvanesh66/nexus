import { createClient, supabaseConfigured } from "@/lib/supabase/server";

/** Signs out and returns to the landing page. POST only, so a link prefetch can never sign anyone out. */
export async function POST(request: Request) {
  if (supabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  return Response.redirect(`${new URL(request.url).origin}/`, 303);
}
