import { decodeEntities } from "./detect";
import { safeFetch } from "../safe-fetch";

export type FetchFailure = { ok: false; reason: "blocked" | "unsupported" };
export type Fetched = { ok: true; title: string; text: string; site: string | null };

const HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5",
  "accept-language": "en-US,en;q=0.9",
};
const MAX_BYTES = 3_000_000;
const BLOCK_END = /<(br|\/p|\/h[1-6]|\/li|\/div|\/blockquote|\/tr)\b[^>]*>/gi;

/** The readable text of an article (Mozilla Readability over linkedom), or why it could not be read. */
export async function fetchArticle(url: string): Promise<Fetched | FetchFailure> {
  let res: Response;
  try {
    res = await safeFetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12_000) });
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

  // Scripts and styles are dropped before parsing: Readability does not need them and parsing is faster without.
  const html = body.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<style\b[\s\S]*?<\/style>/gi, "");
  const meta = (name: string) =>
    html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"))?.[1] ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${name}["']`, "i"))?.[1];

  let title = decodeEntities(meta("og:title") ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim();
  let text = "";
  let site = meta("og:site_name") ?? null;
  try {
    // Loaded on demand, so a parser problem can only ever affect links, never notes.
    const [{ Readability }, { parseHTML }] = await Promise.all([import("@mozilla/readability"), import("linkedom")]);
    const { document } = parseHTML(html);
    const article = new Readability(document as unknown as Document).parse();
    if (article) {
      // From the cleaned HTML rather than textContent, so paragraphs and headings keep their breaks.
      text = decodeEntities((article.content ?? "").replace(BLOCK_END, "\n").replace(/<[^>]+>/g, ""))
        .replace(/[ \t]+/g, " ")
        .replace(/\n\s*\n+/g, "\n\n")
        .trim();
      title = article.title?.trim() || title;
      site = article.siteName ?? site;
    }
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
