import { Readability } from "@mozilla/readability";
import { JSDOM, VirtualConsole } from "jsdom";
import { decodeEntities } from "./detect";

export type FetchFailure = { ok: false; reason: "blocked" | "unsupported" };
export type Fetched = { ok: true; title: string; text: string; site: string | null };

const HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5",
  "accept-language": "en-US,en;q=0.9",
};
const MAX_BYTES = 3_000_000;

/** The readable text of an article (Mozilla Readability), or why it could not be read. */
export async function fetchArticle(url: string): Promise<Fetched | FetchFailure> {
  let res: Response;
  try {
    res = await fetch(url, { headers: HEADERS, redirect: "follow", signal: AbortSignal.timeout(12_000) });
  } catch {
    return { ok: false, reason: "blocked" };
  }
  if (!res.ok) return { ok: false, reason: "blocked" };

  const type = res.headers.get("content-type") ?? "";
  if (type.includes("pdf") || /^(image|video|audio)\//.test(type)) return { ok: false, reason: "unsupported" };
  const length = Number(res.headers.get("content-length") ?? 0);
  if (length > MAX_BYTES) return { ok: false, reason: "unsupported" };

  const body = (await res.text()).slice(0, MAX_BYTES);
  if (type.startsWith("text/plain")) {
    const text = body.trim();
    return text.length > 80 ? { ok: true, title: new URL(url).hostname, text, site: null } : { ok: false, reason: "blocked" };
  }

  // Scripts and styles are dropped before parsing: Readability does not need them and jsdom is faster without.
  const html = body.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<style\b[\s\S]*?<\/style>/gi, "");
  const meta = (name: string) =>
    html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"))?.[1] ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${name}["']`, "i"))?.[1];

  let title = decodeEntities(meta("og:title") ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim();
  let text = "";
  let site = meta("og:site_name") ?? null;
  try {
    const dom = new JSDOM(html, { url, virtualConsole: new VirtualConsole() });
    const article = new Readability(dom.window.document).parse();
    if (article) {
      // From the cleaned HTML rather than textContent, so paragraphs and headings keep their breaks.
      text = decodeEntities(
        (article.content ?? "")
          .replace(/<(br|\/p|\/h[1-6]|\/li|\/div|\/blockquote|\/tr)\b[^>]*>/gi, "\n")
          .replace(/<[^>]+>/g, ""),
      )
        .replace(/[ \t]+/g, " ")
        .replace(/\n\s*\n+/g, "\n\n")
        .trim();
      title = article.title?.trim() || title;
      site = article.siteName ?? site;
    }
    dom.window.close();
  } catch {
    // fall through to the meta description
  }

  if (text.length < 200) {
    const description = decodeEntities(meta("og:description") ?? meta("description") ?? "").trim();
    if (description.length > text.length) text = description;
  }
  if (text.length < 80) return { ok: false, reason: "blocked" };

  return { ok: true, title: title || new URL(url).hostname, text, site: site ? decodeEntities(site) : null };
}
