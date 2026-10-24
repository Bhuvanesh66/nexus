import { safeFetch as fetch } from "../safe-fetch";
/**
 * TikTok's oEmbed API: the caption and author of a public TikTok, which TikTok offers to any app. Nexus does
 * not fetch Instagram or Facebook pages itself (their terms forbid automated collection); those links go
 * through Supadata when SUPADATA_API_KEY is set, or the user drops the video file.
 */
export async function tiktokCaption(url: string): Promise<{ title: string; caption: string } | null> {
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { title?: string; author_name?: string };
    const caption = body.title?.trim();
    if (!caption) return null;
    return { title: body.author_name ? `TikTok by ${body.author_name}` : "TikTok video", caption };
  } catch {
    return null;
  }
}
