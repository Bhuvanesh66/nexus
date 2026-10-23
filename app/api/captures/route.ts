import { NextResponse } from "next/server";
import { fail, SIGNED_OUT } from "@/lib/http";
import { getSession } from "@/lib/supabase/server";
import { SUMMARY_COLUMNS, toSummary } from "@/lib/vault";

/** The signed-in user's Vault, newest first, without raw content or vectors. */
export async function GET() {
  const session = await getSession();
  if (!session) return SIGNED_OUT();

  const { data, error } = await session.supabase
    .from("captures")
    .select(SUMMARY_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    console.error("list captures failed", error.message);
    return fail(500, "load-failed", "Your Vault didn’t load. Try again in a moment.");
  }

  return NextResponse.json(
    { captures: (data ?? []).map((row) => toSummary(row as unknown as Parameters<typeof toSummary>[0])) },
    { headers: { "cache-control": "no-store" } },
  );
}
