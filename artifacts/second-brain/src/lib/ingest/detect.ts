export type CaptureType = "youtube" | "url" | "text" | "tweet" | "video";

/** The input as a URL when the whole drop is one link, otherwise null (it is a note). */
export function parseLink(input: string): URL | null {
  const value = input.trim();
  if (!value || /\s/.test(value)) return null;
  const withScheme = /^https?:\/\//i.test(value)
    ? value
    : /^(www\.|youtu\.be\/|(m\.)?youtube\.com\/|x\.com\/|twitter\.com\/)/i.test(value)
      ? `https://${value}`
      : null;
  if (!withScheme) return null;
  try {
    const url = new URL(withScheme);
    return url.hostname.includes(".") ? url : null;
  } catch {
    return null;
  }
}

/** The video id for youtube.com/watch, youtu.be, /shorts, /embed, /live and /v links. */
export function youtubeId(url: URL): string | null {
  const host = url.hostname.replace(/^(www|m|music)\./, "");
  const valid = (id: string | null | undefined) => (id && /^[\w-]{11}$/.test(id) ? id : null);
  if (host === "youtu.be") return valid(url.pathname.split("/")[1]);
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") return valid(url.searchParams.get("v"));
    const match = url.pathname.match(/^\/(shorts|embed|live|v)\/([\w-]{11})/);
    return valid(match?.[2]);
  }
  return null;
}

export function isPost(url: URL) {
  const host = url.hostname.replace(/^(www|mobile)\./, "");
  return (host === "x.com" || host === "twitter.com") && /^\/\w+\/status\/\d+/.test(url.pathname);
}

/** Short-form video links: Instagram reels and posts, TikTok, Facebook reels. */
export function isReel(url: URL) {
  const host = url.hostname.replace(/^(www|m|vm|vt)\./, "");
  if (host === "instagram.com") return /^\/(reel|reels|p|tv)\/[\w-]+/.test(url.pathname);
  if (host === "tiktok.com") return url.pathname.length > 1;
  if (host === "facebook.com") return /^\/(reel|watch|share\/r|share\/v)\b/.test(url.pathname);
  return host === "fb.watch";
}

export function detectType(url: URL): CaptureType {
  if (youtubeId(url)) return "youtube";
  if (isPost(url)) return "tweet";
  if (isReel(url)) return "video";
  return "url";
}

/** One canonical spelling per source, so the same link dropped twice is recognised. */
export function normalizeUrl(url: URL): string {
  const id = youtubeId(url);
  if (id) return `https://www.youtube.com/watch?v=${id}`;
  const clean = new URL(url.toString());
  clean.hash = "";
  for (const key of [...clean.searchParams.keys()]) {
    if (/^(utm_|fbclid|gclid|igsh|si$|ref$|s$|t$)/.test(key)) clean.searchParams.delete(key);
  }
  if (isPost(clean)) clean.hostname = "x.com";
  const text = clean.toString();
  return text.endsWith("/") && clean.pathname !== "/" ? text.slice(0, -1) : text;
}

/** Refuses links to this machine or a private network, so the server never fetches internal addresses. */
export function isPublicHost(url: URL) {
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    return false;
  }
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) return false;
  const v4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 192 && b === 168)) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
  }
  return true;
}

export function decodeEntities(text: string) {
  return text
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&amp;/g, "&");
}
