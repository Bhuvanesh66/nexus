import { NextResponse } from "next/server";
import {
  AiError,
  aiConfigured,
  complete,
  embed,
  embeddingsConfigured,
  parseJson,
  transcribe,
  transcriptionConfigured,
  withRetry,
} from "@/lib/ai";
import { fail, SIGNED_OUT } from "@/lib/http";
import { fetchArticle } from "@/lib/ingest/article";
import { basicSummary } from "@/lib/ingest/basic";
import { detectType, isPublicHost, normalizeUrl, parseLink, youtubeId } from "@/lib/ingest/detect";
import { fetchPost } from "@/lib/ingest/post";
import { fetchReel } from "@/lib/ingest/reel";
import { youtubeMeta, youtubeTranscript } from "@/lib/ingest/youtube";
import { connectionsPrompt, summarisePrompt } from "@/lib/prompts";
import { getSession } from "@/lib/supabase/server";
import { SUMMARY_COLUMNS, toSummary, type CaptureType, type Connection } from "@/lib/vault";

// Room for one retry of a slow model call (Vercel allows up to 300 s with Fluid compute).
export const maxDuration = 120;

const MAX_INPUT = 10_000;
const MAX_FOR_CLAUDE = 15_000;

type Meta = { title: string; summary: string; one_line_takeaway: string; keywords: string[]; entities: string[] };
type Candidate = { id: string; type: CaptureType; title: string; summary: string; keywords: string[]; entities: string[] };

function strings(value: unknown, max: number, lower = false) {
  if (!Array.isArray(value)) return [];
  const list = value.filter((v): v is string => typeof v === "string" && v.trim().length > 0).map((v) => v.trim());
  return [...new Set(lower ? list.map((v) => v.toLowerCase()) : list)].slice(0, max);
}

const MAX_DOCUMENT = 150_000;

/** A dropped file's name and extracted text, trimmed to a size worth storing; null when there is no text. */
function toDocument(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const v = value as { name?: unknown; kind?: unknown; text?: unknown };
  if (typeof v.name !== "string" || typeof v.text !== "string") return null;
  const text = v.text.trim().slice(0, MAX_DOCUMENT);
  if (!text) return null;
  return {
    name: v.name.trim().slice(0, 200) || "Untitled file",
    kind: v.kind === "pdf" ? ("pdf" as const) : ("text" as const),
    text,
  };
}

/** An uploaded video or audio file in the user's own folder of the "uploads" bucket; null when it isn't one. */
function toMedia(value: unknown, userId: string) {
  if (!value || typeof value !== "object") return null;
  const v = value as { path?: unknown; name?: unknown; mime?: unknown };
  if (typeof v.path !== "string" || typeof v.mime !== "string") return null;
  if (!v.path.startsWith(`${userId}/`) || !/^[\w-]+\/[\w-]+\.[a-z0-9]{1,5}$/.test(v.path)) return null;
  if (!/^(video|audio)\/[\w.+-]+$/.test(v.mime)) return null;
  const name = typeof v.name === "string" && v.name.trim() ? v.name.trim().slice(0, 200) : "Untitled recording";
  return { path: v.path, mime: v.mime, name };
}

/** Checks the model's JSON against the 8.1 contract; null when it does not hold. */
function toMeta(value: unknown): Meta | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.title !== "string" || typeof v.summary !== "string" || typeof v.one_line_takeaway !== "string") return null;
  if (!v.title.trim() || !v.summary.trim()) return null;
  return {
    title: v.title.trim().slice(0, 140),
    summary: v.summary.trim(),
    one_line_takeaway: v.one_line_takeaway.trim().slice(0, 240),
    keywords: strings(v.keywords, 10, true),
    entities: strings(v.entities, 20),
  };
}

/**
 * Drop → Absorb → Connect. Detects the source, fetches it, has the model summarise it (8.1), embeds the summary,
 * finds the nearest fragments the user already has, has the model confirm which are genuinely related (8.2),
 * and saves the capture with its links. Every query runs as the signed-in user, so RLS scopes it to them.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return SIGNED_OUT();
  const { supabase, user } = session;

  const body = (await request.json().catch(() => null)) as {
    input?: unknown;
    pasted?: unknown;
    force?: unknown;
    document?: unknown;
    media?: unknown;
  } | null;
  const input = typeof body?.input === "string" ? body.input.trim() : "";
  const pasted = typeof body?.pasted === "string" ? body.pasted.trim() : "";
  const file = toDocument(body?.document);
  if (body?.document !== undefined && !file) {
    return fail(400, "empty-file", "Nexus couldn’t find any text in that file. Try another, or paste the text.");
  }
  const media = toMedia(body?.media, user.id);
  if (body?.media !== undefined && !media) return fail(400, "bad-media", "That upload didn’t come through. Try again.");
  if (!input && !file && !media) return fail(400, "empty", "Drop a note, a link or a file first.");
  if (input.length > MAX_INPUT || pasted.length > MAX_INPUT) {
    return fail(400, "too-long", "That’s over 10,000 characters. Trim it a little and drop it again.");
  }

  const notices: string[] = [];
  let type: CaptureType = "text";
  let sourceUrl: string | null = null;
  let raw = input;
  let titleHint: string | null = null;
  let mediaPath: string | null = null;
  const removeUpload = () => (media ? supabase.storage.from("uploads").remove([media.path]) : Promise.resolve());

  // A dropped file arrives as text already read in the browser (PDFs via pdf.js); the note, if any, rides along.
  const link = file || media ? null : parseLink(input);
  if (file) {
    type = file.kind === "pdf" ? "pdf" : "text";
    titleHint = file.name.replace(/\.[a-z0-9]{1,5}$/i, "");
    raw = `${file.kind === "pdf" ? "PDF" : "File"}: ${file.name}\n\n${input ? `The user's note: ${input}\n\n` : ""}${file.text}`;
  } else if (media) {
    // A video or audio file the browser uploaded to the user's private folder: transcribe it, keep the original.
    if (!transcriptionConfigured()) {
      await removeUpload();
      return fail(503, "no-transcription", "Nexus can’t transcribe video or audio on this deployment yet.");
    }
    const { data: blob, error } = await supabase.storage.from("uploads").download(media.path);
    if (error || !blob) return fail(404, "upload-missing", "The upload didn’t arrive. Try dropping the file again.");
    let transcript: string;
    try {
      transcript = await transcribe({
        kind: "file",
        bytes: new Uint8Array(await blob.arrayBuffer()),
        mime: media.mime,
        name: media.name,
      });
    } catch {
      await removeUpload();
      return fail(422, "no-transcript", "Nexus couldn’t transcribe this file. Try another, or paste what it says.");
    }
    type = media.mime.startsWith("audio/") ? "audio" : "video";
    titleHint = media.name.replace(/\.[a-z0-9]{1,5}$/i, "");
    mediaPath = media.path;
    raw = `${type === "audio" ? "Audio" : "Video"}: ${media.name}\n\n${input ? `The user's note: ${input}\n\n` : ""}${transcript}`;
  } else if (link) {
    if (!isPublicHost(link)) return fail(400, "bad-link", "Nexus can’t reach that address. Paste a public web link.");
    type = detectType(link);
    sourceUrl = normalizeUrl(link);

    if (body?.force !== true) {
      const { data: existing } = await supabase
        .from("captures")
        .select("id, title, created_at")
        .eq("source_url", sourceUrl)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) {
        return fail(409, "duplicate", "You already saved this. Save again anyway?", {
          savedAt: existing.created_at,
          title: existing.title,
          id: existing.id,
        });
      }
    }

    if (type === "youtube") {
      const id = youtubeId(link) as string;
      const [meta, transcript] = await Promise.all([youtubeMeta(sourceUrl), pasted ? null : youtubeTranscript(id)]);
      titleHint = meta?.title ?? null;
      const heading = `YouTube video: ${meta?.title ?? sourceUrl}${meta?.author ? ` by ${meta.author}` : ""}`;
      if (pasted) raw = `${heading}\n\nThe user's own summary:\n${pasted}`;
      else if (transcript) raw = `${heading}\n\nTranscript:\n${transcript}`;
      else {
        // YouTube refuses captions to most servers; Gemini can watch the video on Google's side instead.
        const watched = transcriptionConfigured()
          ? await transcribe({ kind: "youtube", url: sourceUrl }).catch(() => null)
          : null;
        if (!watched) {
          return fail(422, "no-transcript", "We couldn’t auto-transcribe this video. Paste a summary yourself?", {
            title: meta?.title ?? null,
          });
        }
        raw = `${heading}\n\n${watched}`;
      }
    } else if (pasted) {
      raw = `Saved from ${sourceUrl}\n\n${pasted}`;
    } else if (type === "video") {
      // Reels and short videos: transcribe the video when the platform shares it, otherwise keep the caption.
      const reel = await fetchReel(sourceUrl);
      let transcript: string | null = null;
      if (reel?.video && transcriptionConfigured()) {
        transcript = await transcribe({ kind: "file", bytes: reel.video.bytes, mime: reel.video.mime, name: "reel.mp4" }).catch(
          () => null,
        );
      }
      if (!reel || (!transcript && !reel.caption)) {
        return fail(
          422,
          "blocked",
          "This app doesn’t share its videos with Nexus. Save the video to your phone and drop the file here (Nexus transcribes it), or paste what it says.",
        );
      }
      titleHint = reel.title;
      raw = `${reel.title}\n\n${reel.caption ? `Caption: ${reel.caption}\n\n` : ""}${transcript ?? ""}`.trim();
      if (!transcript) {
        type = "url";
        notices.push("The platform shared only the caption, so that’s what Nexus saved. Drop the video file for a full transcript.");
      }
    } else if (type === "tweet") {
      const post = await fetchPost(sourceUrl);
      if (!post) return fail(422, "blocked", "This post is blocking us. Paste the content you want to save instead.");
      raw = post.text;
      titleHint = post.title;
    } else {
      const article = await fetchArticle(sourceUrl);
      if (!article.ok) {
        return fail(
          422,
          "blocked",
          article.reason === "unsupported"
            ? "Nexus can’t read this kind of file yet. Paste the text you want to save instead."
            : "This page is blocking us. Paste the content you want to save instead.",
        );
      }
      raw = `${article.title}${article.site ? ` (${article.site})` : ""}\n\n${article.text}`;
      titleHint = article.title;
    }
  }

  // Absorb: the model summarises (8.1). Without one, a plain extract is saved and labelled as such.
  let meta: Meta | null = null;
  if (aiConfigured()) {
    try {
      meta = await withRetry(async () => {
        const reply = await complete({
          prompt: summarisePrompt({ content: raw.slice(0, MAX_FOR_CLAUDE), type, sourceUrl }),
          tier: "fast",
          maxTokens: 1000,
          json: true,
        });
        const parsed = toMeta(parseJson(reply));
        if (!parsed) throw new AiError("The summary was not valid JSON.", "failed");
        return parsed;
      });
    } catch {
      notices.push("Nexus’s AI didn’t respond, so this was saved with a basic summary.");
    }
  }
  const summarySource = meta ? "ai" : "basic";
  if (!meta) {
    // Links are stored as a heading paragraph then the body; the plain extract reads the body.
    const content = file
      ? file.text
      : link || media
        ? raw.split("\n\n").slice(1).join("\n\n").replace(/^(Transcript|The user's own summary):\n/, "")
        : raw;
    meta = basicSummary(content || raw, titleHint);
  }

  // Connect: embed the summary and find the nearest fragments this user already has.
  let embedding: number[] | null = null;
  if (embeddingsConfigured()) {
    try {
      embedding = await embed(`${meta.title}\n\n${meta.summary}`);
    } catch {
      notices.push("The embedding service didn’t respond, so connections were matched by keywords this time.");
    }
  }

  let candidates: Candidate[] = [];
  if (embedding) {
    const { data } = await supabase.rpc("match_captures", {
      query_embedding: embedding,
      match_threshold: 0.25,
      match_count: 5,
      for_user: user.id,
    });
    candidates = (data ?? []) as Candidate[];
  } else {
    const terms = [...meta.entities, ...meta.keywords].map((t) => t.replace(/[%_\\]/g, "")).filter((t) => t.length > 2);
    if (terms.length) {
      const { data } = await supabase.rpc("keyword_captures", { terms: terms.slice(0, 16), match_count: 5 });
      candidates = (data ?? []) as Candidate[];
    }
  }

  let connections: Connection[] = [];
  if (candidates.length && summarySource === "ai" && aiConfigured()) {
    // 8.2: the model decides which candidates are genuinely related. Only those are saved.
    try {
      const reply = await withRetry(() =>
        complete({ prompt: connectionsPrompt(meta, candidates), tier: "fast", maxTokens: 800, json: true }),
      );
      const verdicts = parseJson(reply);
      if (Array.isArray(verdicts)) {
        connections = verdicts.flatMap((v) => {
          const verdict = v as { id?: unknown; related?: unknown; reason?: unknown };
          const match = candidates.find((c) => c.id === verdict.id);
          if (!match || verdict.related !== true) return [];
          const reason = typeof verdict.reason === "string" ? verdict.reason.slice(0, 240) : null;
          return [{ id: match.id, title: match.title, type: match.type, reason }];
        });
      }
    } catch {
      notices.push("Nexus couldn’t check connections this time.");
    }
  } else if (candidates.length) {
    // Without a model: only fragments that share an exact keyword or name, and the reason says so.
    const mine = new Set([...meta.keywords, ...meta.entities].map((t) => t.toLowerCase()));
    connections = candidates.flatMap((c) => {
      const shared = [...new Set([...c.keywords, ...c.entities].map((t) => t.toLowerCase()))].filter((t) => mine.has(t));
      return shared.length
        ? [{ id: c.id, title: c.title, type: c.type, reason: `Shares the keywords: ${shared.slice(0, 3).join(", ")}.` }]
        : [];
    });
  }

  const { data: inserted, error } = await supabase
    .from("captures")
    .insert({
      user_id: user.id,
      type,
      source_url: sourceUrl,
      raw_content: raw,
      title: meta.title,
      summary: meta.summary,
      one_line_takeaway: meta.one_line_takeaway,
      keywords: meta.keywords,
      entities: meta.entities,
      embedding,
      summary_source: summarySource,
      media_path: mediaPath,
    })
    .select(SUMMARY_COLUMNS)
    .single();
  if (error || !inserted) {
    console.error("capture insert failed", error?.message);
    await removeUpload();
    return fail(500, "save-failed", "Nexus couldn’t save this just now. Try again in a moment.");
  }
  const capture = toSummary(inserted as unknown as Parameters<typeof toSummary>[0]);

  if (connections.length) {
    const { error: linkError } = await supabase.from("capture_links").insert(
      connections.map((c) => ({ user_id: user.id, from_capture_id: capture.id, to_capture_id: c.id, reason: c.reason })),
    );
    if (linkError) {
      console.error("link insert failed", linkError.message);
      notices.push("Saved, but the connections couldn’t be stored this time.");
      connections = [];
    }
  }

  return NextResponse.json(
    { capture: { ...capture, connection_count: connections.length }, connections, notices },
    { headers: { "cache-control": "no-store" } },
  );
}
