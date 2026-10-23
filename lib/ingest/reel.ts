import { decodeEntities } from "./detect";

/**
 * Short-form video links (Instagram reels and posts, TikTok, Facebook reels). Nexus only uses what a platform
 * offers openly: TikTok's oEmbed API (the caption and author), and Open Graph tags when a page serves them to an
 * ordinary request, sometimes with a direct video link that can be transcribed. It does not log in, pose as
 * another crawler or scrape around a login wall; Instagram's terms forbid automated collection, so for most
 * reels the honest path is the user dropping the video file, which Nexus transcribes.
 */

const HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  "accept-language": "en-US,en;q=0.9",
};
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export type Reel = {
  title: string;
  caption: string | null;
  video: { bytes: Uint8Array; mime: string } | null;
};

export async function fetchReel(url: string): Promise<Reel | null> {
  let title = "";
  let caption: string | null = null;
  let videoUrl = "";

  if (/tiktok\.com/.test(url)) {
    try {
      const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const body = (await res.json()) as { title?: string; author_name?: string };
        caption = body.title?.trim() || null;
        title = body.author_name ? `TikTok by ${body.author_name}` : "TikTok video";
      }
    } catch {
      // nothing shared
    }
  } else {
    try {
      const res = await fetch(url, { headers: HEADERS, redirect: "follow", signal: AbortSignal.timeout(10_000) });
      const html = res.ok ? (await res.text()).slice(0, 2_000_000) : "";
      const meta = (name: string) =>
        html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"))?.[1] ??
        html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${name}["']`, "i"))?.[1];
      title = decodeEntities(meta("og:title") ?? "").trim();
      caption = decodeEntities(meta("og:description") ?? "").trim() || null;
      videoUrl = decodeEntities(meta("og:video:secure_url") ?? meta("og:video") ?? "");
    } catch {
      // nothing shared
    }
  }

  let video: Reel["video"] = null;
  if (videoUrl.startsWith("https://")) {
    try {
      const res = await fetch(videoUrl, { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
      const mime = (res.headers.get("content-type") ?? "video/mp4").split(";")[0].trim();
      const length = Number(res.headers.get("content-length") ?? 0);
      if (res.ok && mime.startsWith("video/") && length <= MAX_VIDEO_BYTES) {
        const bytes = new Uint8Array(await res.arrayBuffer());
        if (bytes.byteLength && bytes.byteLength <= MAX_VIDEO_BYTES) video = { bytes, mime };
      }
    } catch {
      // the caption is still worth keeping
    }
  }

  if (!caption && !video) return null;
  return { title: title || "Short video", caption, video };
}
