import { NextResponse } from "next/server";
import { fail, isUuid, SIGNED_OUT } from "@/lib/http";
import { getSession } from "@/lib/supabase/server";
import type { CaptureType, Connection } from "@/lib/vault";

type Params = { params: Promise<{ id: string }> };
type Linked = { reason: string | null; other: { id: string; title: string; type: CaptureType } | null };

/** One fragment with its summary, keywords, names and the fragments it is connected to (both directions). */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!isUuid(id)) return fail(404, "not-found", "That fragment isn’t in your Vault.");
  const session = await getSession();
  if (!session) return SIGNED_OUT();
  const { supabase } = session;

  const [{ data: capture }, outgoing, incoming] = await Promise.all([
    supabase
      .from("captures")
      .select("id, type, source_url, title, summary, one_line_takeaway, keywords, entities, created_at, summary_source")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("capture_links")
      .select("reason, other:captures!capture_links_to_capture_id_fkey(id, title, type)")
      .eq("from_capture_id", id),
    supabase
      .from("capture_links")
      .select("reason, other:captures!capture_links_from_capture_id_fkey(id, title, type)")
      .eq("to_capture_id", id),
  ]);
  if (!capture) return fail(404, "not-found", "That fragment isn’t in your Vault.");

  const seen = new Set<string>();
  const connections: Connection[] = [];
  for (const link of [...(outgoing.data ?? []), ...(incoming.data ?? [])] as unknown as Linked[]) {
    if (!link.other || seen.has(link.other.id)) continue;
    seen.add(link.other.id);
    connections.push({ ...link.other, reason: link.reason });
  }

  return NextResponse.json(
    { capture: { ...capture, connection_count: connections.length, connections } },
    { headers: { "cache-control": "no-store" } },
  );
}

/** Deletes a fragment. Its links go with it (on delete cascade), so it never surfaces in an ask again. */
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!isUuid(id)) return fail(404, "not-found", "That fragment isn’t in your Vault.");
  const session = await getSession();
  if (!session) return SIGNED_OUT();

  const { data, error } = await session.supabase.from("captures").delete().eq("id", id).select("id");
  if (error) {
    console.error("delete failed", error.message);
    return fail(500, "delete-failed", "Nexus couldn’t delete that just now. Try again.");
  }
  if (!data?.length) return fail(404, "not-found", "That fragment isn’t in your Vault.");
  return new NextResponse(null, { status: 204 });
}
