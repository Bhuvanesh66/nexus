/**
 * Reading what is dragged into the Drop box. Files are read in the browser, so nothing but their text is
 * uploaded: PDFs through pdf.js (unpdf, loaded only when a PDF arrives), text files as they are. Links and
 * text dragged from another tab or app come through as text.
 */

export type Attached = { name: string; kind: "pdf" | "text"; text: string; pages: number | null; chars: number };
export type ReadResult = { ok: true; file: Attached } | { ok: false; message: string };

const TEXT_FILE = /\.(txt|md|markdown|csv|tsv|json|html?|xml|log|ya?ml)$/i;
const MAX_BYTES = 20 * 1024 * 1024;
export const MAX_FILE_CHARS = 150_000;

export const ACCEPT = "application/pdf,.pdf,text/plain,.txt,.md,.markdown,.csv,.tsv,.json,.html,.htm,.xml,.log,.yml,.yaml";

function attached(name: string, kind: Attached["kind"], text: string, pages: number | null): Attached {
  return { name, kind, text: text.slice(0, MAX_FILE_CHARS), pages, chars: text.length };
}

export async function readFile(file: File): Promise<ReadResult> {
  if (file.size > MAX_BYTES) {
    return { ok: false, message: `${file.name} is over 20 MB. Drop a smaller file, or paste the part that matters.` };
  }
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  const isText = file.type.startsWith("text/") || file.type === "application/json" || TEXT_FILE.test(file.name);

  try {
    if (isPdf) {
      const { getDocumentProxy, extractText } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
      const { totalPages, text } = await extractText(pdf, { mergePages: true });
      const clean = text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
      if (!clean) {
        return {
          ok: false,
          message: `${file.name} has no text Nexus can read; it may be scanned pages. Paste the part that matters instead.`,
        };
      }
      return { ok: true, file: attached(file.name, "pdf", clean, totalPages) };
    }
    if (isText) {
      let text = (await file.text()).trim();
      if (/\.html?$/i.test(file.name)) text = text.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "").replace(/<[^>]+>/g, " ");
      text = text.replace(/[ \t]+/g, " ").trim();
      if (!text) return { ok: false, message: `${file.name} is empty.` };
      return { ok: true, file: attached(file.name, "text", text, null) };
    }
  } catch {
    return { ok: false, message: `Nexus couldn’t open ${file.name}. Try another copy, or paste the text instead.` };
  }

  if (file.type.startsWith("image/")) {
    return { ok: false, message: "Nexus can’t read images yet. Drop a PDF, a text file or a link, or type what it says." };
  }
  return { ok: false, message: `Nexus reads PDFs, text files and links for now, and ${file.name} isn’t one of those.` };
}

/** Whether a drag carries something the Drop box can take. */
export function canTake(data: DataTransfer | null) {
  const types = Array.from(data?.types ?? []);
  return types.includes("Files") || types.includes("text/uri-list") || types.includes("text/plain");
}

/** The link (preferred) or text in a drag from another tab or app. */
export function draggedText(data: DataTransfer) {
  const uri = data
    .getData("text/uri-list")
    .split(/\r?\n/)
    .find((line) => line && !line.startsWith("#"));
  return (uri || data.getData("text/plain") || "").trim();
}
