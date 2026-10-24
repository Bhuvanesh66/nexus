import { fail, isUuid, SIGNED_OUT } from "@/lib/http";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/supabase/server";
import type { CaptureType, Connection } from "@/lib/vault";

type Params = { params: Promise<{ id: string }> };
type Linked = { reason: string | null; other: { id: string; title: string; type: CaptureType } | null };

/**
 * One fragment with its summary, keywords, names, the fragments it is connected to (both directions), and a
 * one-hour link to the original video or audio when it was uploaded.
 */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!isUuid(id)) return fail(404, "not-found", "That fragment isn’t in your Vault.");
  const session = await getSession();
  if (!session) return SIGNED_OUT();
  const { supabase } = session;

  const [{ data: row }, outgoing, incoming] = await Promise.all([
    supabase
      .from("captures")
      .select(
        "id, type, source_url, title, summary, one_line_takeaway, keywords, entities, created_at, summary_source, media_path",
      )
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
  if (!row) return fail(404, "not-found", "That fragment isn’t in your Vault.");

  const seen = new Set<string>();
  const connections: Connection[] = [];
  for (const link of [...(outgoing.data ?? []), ...(incoming.data ?? [])] as unknown as Linked[]) {
    if (!link.other || seen.has(link.other.id)) continue;
    seen.add(link.other.id);
    connections.push({ ...link.other, reason: link.reason });
  }

  const { media_path: mediaPath, ...capture } = row;
  let mediaUrl: string | null = null;
  if (mediaPath) {
    const { data } = await supabase.storage.from("uploads").createSignedUrl(mediaPath, 3600);
    mediaUrl = data?.signedUrl ?? null;
  }

  return Response.json(
    { capture: { ...capture, connection_count: connections.length, connections, media_url: mediaUrl } },
    { headers: { "cache-control": "no-store" } },
  );
}

/**
 * Deletes a fragment. Its links go with it (on delete cascade), so it never surfaces in an ask again, and an
 * uploaded original is removed from storage too.
 */
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!isUuid(id)) return fail(404, "not-found", "That fragment isn’t in your Vault.");
  const session = await getSession();
  if (!session) return SIGNED_OUT();

  const { data, error } = await session.supabase.from("captures").delete().eq("id", id).select("id, media_path");
  if (error) {
    logger.error({ message: error.message }, "delete failed");
    return fail(500, "delete-failed", "Nexus couldn’t delete that just now. Try again.");
  }
  if (!data?.length) return fail(404, "not-found", "That fragment isn’t in your Vault.");
  const mediaPath = data[0].media_path as string | null;
  if (mediaPath) {
    const { error: storageError } = await session.supabase.storage.from("uploads").remove([mediaPath]);
    if (storageError) logger.error({ message: storageError.message }, "media delete failed");
  }
  return new Response(null, { status: 204 });
}
