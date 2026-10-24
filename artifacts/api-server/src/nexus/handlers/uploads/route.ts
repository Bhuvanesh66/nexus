import { fail, SIGNED_OUT } from "@/lib/http";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/supabase/server";

const MAX_MEDIA_BYTES = 50 * 1024 * 1024;

/**
 * A one-time signed link the browser uploads a video or audio file to, straight into the user's own folder of
 * the private "uploads" bucket. Files never pass through this function, so Vercel's 4.5 MB body limit doesn't
 * apply; the bucket itself enforces 50 MB and video/audio only, and RLS keeps each user in their own folder.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return SIGNED_OUT();
  const { supabase, user } = session;

  const body = (await request.json().catch(() => null)) as { name?: unknown; type?: unknown; size?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name : "";
  const type = typeof body?.type === "string" ? body.type : "";
  const size = typeof body?.size === "number" ? body.size : 0;
  if (!/^(video|audio)\//.test(type)) return fail(400, "bad-type", "Nexus takes video and audio files here.");
  if (size <= 0 || size > MAX_MEDIA_BYTES) {
    return fail(400, "too-big", "That file is over 50 MB. Trim it, or drop a shorter clip.");
  }

  const ext = (name.match(/\.([a-z0-9]{1,5})$/i)?.[1] ?? type.split("/")[1] ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${user.id}/${crypto.randomUUID()}.${ext || "bin"}`;
  const { data, error } = await supabase.storage.from("uploads").createSignedUploadUrl(path);
  if (error || !data) {
    logger.error({ message: error?.message }, "signed upload url failed");
    return fail(500, "upload-failed", "Nexus couldn’t get the upload ready. Try again in a moment.");
  }

  return Response.json({ path, url: data.signedUrl }, { headers: { "cache-control": "no-store" } });
}
