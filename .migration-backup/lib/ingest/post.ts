import { decodeEntities } from "./detect";

/** The text of a post on X, from the public oEmbed endpoint (no login, no API key). */
export async function fetchPost(url: string): Promise<{ title: string; text: string } | null> {
  try {
    const res = await fetch(
      `https://publish.x.com/oembed?omit_script=1&dnt=1&url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { author_name?: string; html?: string };
    const paragraph = body.html?.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? "";
    const text = decodeEntities(paragraph.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")).trim();
    if (!text) return null;
    const author = body.author_name ?? "someone on X";
    return { title: `Post by ${author}`, text: `Post on X by ${author}:\n\n${text}` };
  } catch {
    return null;
  }
}
