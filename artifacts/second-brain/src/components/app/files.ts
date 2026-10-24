/**
 * Reading what is dragged into the Drop box. Documents are read in the browser, so nothing but their text is
 * uploaded: PDFs through pdf.js (unpdf, loaded only when a PDF arrives), text files as they are. Video and audio
 * files are uploaded as they are, straight to the user's private storage, and transcribed on the server. Links
 * and text dragged from another tab or app come through as text.
 */

export type Attached = {
  name: string;
  kind: "pdf" | "text" | "video" | "audio";
  /** Extracted text for documents; empty for media. */
  text: string;
  pages: number | null;
  chars: number;
  /** The file itself, for media that will be uploaded. */
  media: File | null;
  mime: string;
  bytes: number;
  /** Length in seconds, for media, when the browser can tell. */
  duration: number | null;
};
export type ReadResult = { ok: true; file: Attached } | { ok: false; message: string };

const TEXT_FILE = /\.(txt|md|markdown|csv|tsv|json|html?|xml|log|ya?ml)$/i;
const MAX_DOC_BYTES = 20 * 1024 * 1024;
export const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
export const MAX_FILE_CHARS = 150_000;

const MEDIA_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mpeg: "video/mpeg",
  mpg: "video/mpeg",
  "3gp": "video/3gpp",
  avi: "video/x-msvideo",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  wav: "audio/wav",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  opus: "audio/ogg",
  flac: "audio/flac",
};

export const ACCEPT =
  "application/pdf,.pdf,text/plain,.txt,.md,.markdown,.csv,.tsv,.json,.html,.htm,.xml,.log,.yml,.yaml," +
  "video/*,audio/*,.mp4,.m4v,.mov,.webm,.mp3,.m4a,.aac,.wav,.ogg,.opus,.flac";

function mediaType(file: File) {
  if (/^(video|audio)\//.test(file.type)) return file.type;
  const ext = file.name.match(/\.([a-z0-9]{1,5})$/i)?.[1]?.toLowerCase() ?? "";
  return MEDIA_TYPES[ext] ?? null;
}

function document(name: string, kind: "pdf" | "text", text: string, pages: number | null): Attached {
  return { name, kind, text: text.slice(0, MAX_FILE_CHARS), pages, chars: text.length, media: null, mime: "", bytes: 0, duration: null };
}

/** The length of a video or audio file, read from its metadata in the browser; null when it can't tell. */
function readDuration(file: File, mime: string): Promise<number | null> {
  return new Promise((resolve) => {
    const el = window.document.createElement(mime.startsWith("audio/") ? "audio" : "video");
    const url = URL.createObjectURL(file);
    const done = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    el.preload = "metadata";
    el.onloadedmetadata = () => done(Number.isFinite(el.duration) ? el.duration : null);
    el.onerror = () => done(null);
    window.setTimeout(() => done(null), 4000);
    el.src = url;
  });
}

export async function readFile(file: File): Promise<ReadResult> {
  const mime = mediaType(file);
  if (mime) {
    if (file.size > MAX_MEDIA_BYTES) {
      return { ok: false, message: `${file.name} is over 50 MB. Trim it, or drop a shorter clip.` };
    }
    const kind = mime.startsWith("audio/") ? "audio" : "video";
    const duration = await readDuration(file, mime);
    return {
      ok: true,
      file: { name: file.name, kind, text: "", pages: null, chars: 0, media: file, mime, bytes: file.size, duration },
    };
  }

  if (file.size > MAX_DOC_BYTES) {
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
      return { ok: true, file: document(file.name, "pdf", clean, totalPages) };
    }
    if (isText) {
      let text = (await file.text()).trim();
      if (/\.html?$/i.test(file.name)) text = text.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "").replace(/<[^>]+>/g, " ");
      text = text.replace(/[ \t]+/g, " ").trim();
      if (!text) return { ok: false, message: `${file.name} is empty.` };
      return { ok: true, file: document(file.name, "text", text, null) };
    }
  } catch {
    return { ok: false, message: `Nexus couldn’t open ${file.name}. Try another copy, or paste the text instead.` };
  }

  if (file.type.startsWith("image/")) {
    return { ok: false, message: "Nexus can’t read images yet. Drop a PDF, a video or a link, or type what it says." };
  }
  return { ok: false, message: `Nexus reads PDFs, text files, videos, audio and links, and ${file.name} isn’t one of those.` };
}

/** Sends a media file to its signed upload link, reporting progress from 0 to 100. Resolves true when stored. */
export function uploadWithProgress(url: string, file: File, mime: string, onProgress: (pct: number) => void, signal: AbortSignal) {
  return publicKey().then((key) => new Promise<boolean>((resolve) => {
    if (signal.aborted) return resolve(false);
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", mime);
    xhr.setRequestHeader("x-upsert", "false");
    if (key) xhr.setRequestHeader("apikey", key);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.onabort = () => resolve(false);
    signal.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  }));
}

/** The public Supabase key, served by GET /api/config so it is configured once, on the server. */
let keyPromise: Promise<string | null> | null = null;
function publicKey(): Promise<string | null> {
  keyPromise ??= fetch("/api/config", { credentials: "include" })
    .then((res) => (res.ok ? res.json() : null))
    .then((body: { supabaseKey?: string } | null) => body?.supabaseKey || null)
    .catch(() => {
      keyPromise = null;
      return null;
    });
  return keyPromise;
}

export function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function formatDuration(seconds: number) {
  const s = Math.round(seconds);
  return s >= 3600
    ? `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
    : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
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
