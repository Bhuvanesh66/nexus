import { NextResponse, type NextRequest } from "next/server";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

/** Signs out and returns to the landing page. POST only, so a link prefetch can never sign anyone out. */
export async function POST(request: NextRequest) {
  if (supabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(`${request.nextUrl.origin}/`, { status: 303 });
}
