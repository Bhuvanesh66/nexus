import { decodeEntities } from "./detect";

const BROWSER_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  "accept-language": "en-US,en;q=0.9",
  cookie: "CONSENT=YES+cb; SOCS=CAI",
};

type Track = { baseUrl: string; languageCode: string; kind?: string };

/** The video's title and channel from YouTube's oEmbed endpoint, which works even when captions don't. */
export async function youtubeMeta(videoUrl: string): Promise<{ title: string; author: string } | null> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(videoUrl)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { title?: string; author_name?: string };
    return { title: body.title ?? "YouTube video", author: body.author_name ?? "" };
  } catch {
    return null;
  }
}

/**
 * The transcript as plain text, or null when the video has none or YouTube refuses. Same method as
 * youtube-transcript-api: read the innertube key from the watch page, ask the player API (Android client)
 * for caption tracks, prefer English (human over auto-generated), then fetch and flatten the track.
 */
export async function youtubeTranscript(videoId: string): Promise<string | null> {
  try {
    const page = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(10_000),
    });
    if (!page.ok) return null;
    const html = await page.text();
    const key = html.match(/"INNERTUBE_API_KEY":\s*"([^"]+)"/)?.[1];
    if (!key) return null;

    const player = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${key}`, {
      method: "POST",
      headers: { ...BROWSER_HEADERS, "content-type": "application/json" },
      body: JSON.stringify({
        context: { client: { clientName: "ANDROID", clientVersion: "20.10.38" } },
        videoId,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!player.ok) return null;
    const data = (await player.json()) as {
      captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: Track[] } };
    };
    const tracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    if (!tracks.length) return null;

    const english = tracks.filter((t) => t.languageCode.startsWith("en"));
    const track =
      english.find((t) => t.kind !== "asr") ?? english[0] ?? tracks.find((t) => t.kind !== "asr") ?? tracks[0];

    const xmlRes = await fetch(track.baseUrl.replace("&fmt=srv3", ""), {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(10_000),
    });
    if (!xmlRes.ok) return null;
    const xml = await xmlRes.text();
    const pieces = [...xml.matchAll(/<(?:text|p)\b[^>]*>([\s\S]*?)<\/(?:text|p)>/g)].map((m) =>
      decodeEntities(decodeEntities(m[1].replace(/<[^>]+>/g, ""))).trim(),
    );
    const text = pieces.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    return text.length > 40 ? text : null;
  } catch {
    return null;
  }
}
