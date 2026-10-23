/**
 * The two AI calls Nexus makes: a language model for text, and an embedding model for 1536-dimension vectors.
 *
 * Text, first one configured wins:
 *   ANTHROPIC_API_KEY  → Claude (Haiku 5.5 fast, Sonnet 5.5 smart)
 *   GEMINI_API_KEY     → Gemini (latest Flash-Lite for both, latest Flash as the stand-in when it is busy;
 *                        GEMINI_MODEL_FAST / GEMINI_MODEL_SMART override)
 *   AI Gateway         → Claude through Vercel AI Gateway
 * Embeddings, first one configured wins. Keep one provider for the life of a Vault: vectors from different
 * models can't be compared, so switching means re-embedding.
 *   GEMINI_API_KEY     → gemini-embedding-001 at 1536 dimensions (GEMINI_EMBEDDING_MODEL overrides)
 *   OPENAI_API_KEY     → text-embedding-3-small (1536)
 *   AI Gateway         → openai/text-embedding-3-small
 * The gateway is used with AI_GATEWAY_API_KEY, or with the deployment's OIDC token when AI_GATEWAY_USE_OIDC=1.
 * Keys are read on the server only.
 */

export type ModelTier = "fast" | "smart";
/** What a vector is for: stored fragments are documents, a task is a query (Gemini embeds them differently). */
export type EmbedPurpose = "document" | "query";

const ANTHROPIC_MODELS: Record<ModelTier, string> = { fast: "claude-haiku-5-5", smart: "claude-sonnet-5-5" };
const GATEWAY_MODELS: Record<ModelTier, string> = {
  fast: "anthropic/claude-haiku-5.5",
  smart: "anthropic/claude-sonnet-5.5",
};
const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const EMBEDDING_DIMENSIONS = 1536;

type GeminiSlot = ModelTier | "embed";
const GEMINI_DEFAULTS: Record<GeminiSlot, string> = {
  fast: process.env.GEMINI_MODEL_FAST || "gemini-flash-lite-latest",
  // Flash-Lite answers hand-offs in seconds and writes them well; Flash was often too busy to answer in time.
  smart: process.env.GEMINI_MODEL_SMART || "gemini-flash-lite-latest",
  embed: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
};
// Learned per server instance: the model that answered for each slot, and settings a model refused.
const geminiModels: Partial<Record<GeminiSlot, string>> = {};
const geminiNoThinkingConfig = new Set<string>();
const geminiNoJsonMode = new Set<string>();
const geminiBusyUntil = new Map<string, number>();
const GEMINI_STAND_IN = "gemini-flash-latest";
const OWN_MODEL_MS = 20_000;
const BUSY_MS = 5 * 60_000;

export class AiError extends Error {
  constructor(
    message: string,
    readonly code: "not-configured" | "failed",
  ) {
    super(message);
  }
}

function gatewayToken() {
  if (process.env.AI_GATEWAY_API_KEY) return process.env.AI_GATEWAY_API_KEY;
  if (process.env.AI_GATEWAY_USE_OIDC === "1") return process.env.VERCEL_OIDC_TOKEN;
  return undefined;
}

export function aiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY || gatewayToken());
}

export function embeddingsConfigured() {
  return Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || gatewayToken());
}

/** One completion; returns the text. `json` asks for a JSON-only reply where the provider supports it. */
export async function complete({
  prompt,
  tier,
  maxTokens,
  json = false,
  signal,
}: {
  prompt: string;
  tier: ModelTier;
  maxTokens: number;
  json?: boolean;
  signal?: AbortSignal;
}): Promise<string> {
  const timeout = AbortSignal.timeout(tier === "smart" ? 50_000 : 30_000);
  const abort = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const messages = [{ role: "user", content: prompt }];

  if (process.env.ANTHROPIC_API_KEY) {
    const res = await post(
      "https://api.anthropic.com/v1/messages",
      { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      { model: ANTHROPIC_MODELS[tier], max_tokens: maxTokens, messages },
      abort,
    );
    const body = res as { content?: { type: string; text?: string }[] };
    const text = body.content?.find((part) => part.type === "text")?.text;
    if (!text) throw new AiError("The model returned no text.", "failed");
    return text;
  }

  if (process.env.GEMINI_API_KEY) {
    const res = await gemini(
      tier,
      "generateContent",
      (model) => ({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          // The ceiling leaves room for thinking, which Gemini counts as output.
          maxOutputTokens: maxTokens + 4096,
          ...(json && !geminiNoJsonMode.has(model) ? { responseMimeType: "application/json" } : {}),
          // Summaries skip thinking for speed; hand-offs think a little. Models that refuse this get none.
          ...(geminiNoThinkingConfig.has(model)
            ? {}
            : { thinkingConfig: { thinkingBudget: tier === "fast" ? 0 : 1024 } }),
        },
      }),
      abort,
    );
    const body = res as {
      candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
    };
    const text = (body.candidates?.[0]?.content?.parts ?? [])
      .filter((p) => !p.thought && p.text)
      .map((p) => p.text)
      .join("");
    if (!text) throw new AiError(`Gemini returned no text (${body.candidates?.[0]?.finishReason ?? "no candidate"}).`, "failed");
    return text;
  }

  const token = gatewayToken();
  if (!token) throw new AiError("No AI provider is configured.", "not-configured");
  const res = await post(
    `${GATEWAY_URL}/chat/completions`,
    { authorization: `Bearer ${token}` },
    { model: GATEWAY_MODELS[tier], max_tokens: maxTokens, messages },
    abort,
  );
  const text = (res as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content;
  if (!text) throw new AiError("The model returned no text.", "failed");
  return text;
}

/** One embedding vector for the text. Throws AiError. */
export async function embed(
  text: string,
  { purpose = "document", signal }: { purpose?: EmbedPurpose; signal?: AbortSignal } = {},
): Promise<number[]> {
  const input = text.slice(0, 8000);
  const timeout = AbortSignal.timeout(20_000);
  const abort = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let vector: number[] | undefined;
  if (process.env.GEMINI_API_KEY) {
    const res = await gemini(
      "embed",
      "embedContent",
      () => ({
        content: { parts: [{ text: input }] },
        taskType: purpose === "query" ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT",
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
      abort,
    );
    vector = (res as { embedding?: { values?: number[] } }).embedding?.values;
  } else if (process.env.OPENAI_API_KEY) {
    const res = await post(
      "https://api.openai.com/v1/embeddings",
      { authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      { model: "text-embedding-3-small", input },
      abort,
    );
    vector = (res as { data?: { embedding?: number[] }[] }).data?.[0]?.embedding;
  } else {
    const token = gatewayToken();
    if (!token) throw new AiError("No embedding provider is configured.", "not-configured");
    const res = await post(
      `${GATEWAY_URL}/embeddings`,
      { authorization: `Bearer ${token}` },
      { model: "openai/text-embedding-3-small", input },
      abort,
    );
    vector = (res as { data?: { embedding?: number[] }[] }).data?.[0]?.embedding;
  }

  if (!vector || vector.length !== EMBEDDING_DIMENSIONS) throw new AiError("The embedding came back malformed.", "failed");
  return vector;
}

/* ---------- transcription: YouTube links, uploaded video and audio, reels fetched from their page ---------- */

export type MediaSource =
  | { kind: "youtube"; url: string }
  | { kind: "file"; bytes: Uint8Array; mime: string; name: string };

const GEMINI_FILES_URL = "https://generativelanguage.googleapis.com";
const INLINE_MAX_BYTES = 10 * 1024 * 1024; // Gemini takes up to 20 MB per request; base64 adds a third
const GROQ_MAX_BYTES = 25 * 1024 * 1024; // Groq's free-tier file limit

const VIDEO_PROMPT = `Transcribe this video for a personal knowledge app. Reply in plain text, in exactly this shape:

Transcript:
<everything that is said, word for word, in the original language; if nothing is said, write (no speech)>

On-screen text:
<text shown on screen that carries information, one item per line, or (none)>

What's shown:
<two or three sentences on what the video shows>`;

const AUDIO_PROMPT =
  "Transcribe everything said in this audio, word for word, in the original language. Reply with the transcript only.";

export function transcriptionConfigured() {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY);
}

/**
 * Speech (and, for video, on-screen text) as plain text. Video goes to Gemini first, because reels often carry
 * their point in captions and on-screen text that speech-to-text misses; audio goes to Groq Whisper first when
 * GROQ_API_KEY is set. Each falls back to the other. YouTube links are read by Gemini on Google's side, so they
 * work from servers YouTube refuses captions to.
 */
export async function transcribe(source: MediaSource, signal?: AbortSignal): Promise<string> {
  const timeout = AbortSignal.timeout(170_000);
  const abort = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const audio = source.kind === "file" && source.mime.startsWith("audio/");
  let lastError: unknown = null;
  for (const provider of audio ? ["groq", "gemini"] : ["gemini", "groq"]) {
    try {
      if (provider === "gemini" && process.env.GEMINI_API_KEY) return await geminiTranscribe(source, audio, abort);
      if (
        provider === "groq" &&
        process.env.GROQ_API_KEY &&
        source.kind === "file" &&
        source.bytes.byteLength <= GROQ_MAX_BYTES
      ) {
        return await groqTranscribe(source, abort);
      }
    } catch (error) {
      lastError = error;
      if (abort.aborted) break;
    }
  }
  if (lastError) throw lastError;
  throw new AiError("No transcription provider is configured.", "not-configured");
}

async function geminiTranscribe(source: MediaSource, audio: boolean, signal: AbortSignal) {
  const key = process.env.GEMINI_API_KEY as string;
  let uploaded: string | null = null;

  const run = async (media: Record<string, unknown>) => {
    const res = await gemini(
      "fast",
      "generateContent",
      () => ({
        contents: [{ role: "user", parts: [media, { text: audio ? AUDIO_PROMPT : VIDEO_PROMPT }] }],
        generationConfig: {
          maxOutputTokens: 16384,
          ...(audio ? {} : { mediaResolution: "MEDIA_RESOLUTION_LOW" }),
        },
      }),
      signal,
      // Long media is slow by nature: wait longer, and don't bench the model for it.
      { ownModelMs: 80_000, standInOnTimeout: false },
    );
    const body = res as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };
    const text = (body.candidates?.[0]?.content?.parts ?? [])
      .filter((p) => !p.thought && p.text)
      .map((p) => p.text)
      .join("")
      .trim();
    if (!text) throw new AiError("Gemini returned no transcript.", "failed");
    return text;
  };

  try {
    if (source.kind === "youtube") {
      // Read on Google's side (public videos only). The first 15 minutes at a frame every two seconds keeps
      // long talks quick; if the API refuses those settings, read the video as it is.
      const video = { fileData: { fileUri: source.url } };
      try {
        return await run({ ...video, videoMetadata: { endOffset: "900s", fps: 0.5 } });
      } catch (error) {
        if (error instanceof AiError && /returned 400/.test(error.message)) return await run(video);
        throw error;
      }
    }
    if (source.bytes.byteLength <= INLINE_MAX_BYTES) {
      return await run({ inlineData: { mimeType: source.mime, data: Buffer.from(source.bytes).toString("base64") } });
    }
    const file = await geminiUpload(source, key, signal);
    uploaded = file.name;
    return await run({ fileData: { fileUri: file.uri, mimeType: source.mime } });
  } finally {
    if (uploaded) {
      // Files expire after 48 hours anyway; this just tidies up straight away.
      void fetch(`${GEMINI_FILES_URL}/v1beta/${uploaded}`, { method: "DELETE", headers: { "x-goog-api-key": key } }).catch(
        () => undefined,
      );
    }
  }
}

/** Gemini Files API: resumable upload, then wait until the file has been processed. */
async function geminiUpload(source: Extract<MediaSource, { kind: "file" }>, key: string, signal: AbortSignal) {
  const start = await fetch(`${GEMINI_FILES_URL}/upload/v1beta/files`, {
    method: "POST",
    headers: {
      "x-goog-api-key": key,
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(source.bytes.byteLength),
      "X-Goog-Upload-Header-Content-Type": source.mime,
      "content-type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: source.name.slice(0, 100) } }),
    signal,
  });
  const uploadUrl = start.headers.get("x-goog-upload-url");
  if (!start.ok || !uploadUrl) throw new AiError(`Gemini refused the upload (${start.status}).`, "failed");

  const done = await fetch(uploadUrl, {
    method: "POST",
    headers: { "X-Goog-Upload-Offset": "0", "X-Goog-Upload-Command": "upload, finalize" },
    body: source.bytes as unknown as BodyInit,
    signal,
  });
  const file = ((await done.json().catch(() => ({}))) as { file?: { name: string; uri: string; state?: string } }).file;
  if (!done.ok || !file) throw new AiError(`Gemini upload failed (${done.status}).`, "failed");

  let state = file.state ?? "PROCESSING";
  for (let i = 0; state === "PROCESSING" && i < 30; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const check = await fetch(`${GEMINI_FILES_URL}/v1beta/${file.name}`, { headers: { "x-goog-api-key": key }, signal });
    state = ((await check.json().catch(() => ({}))) as { state?: string }).state ?? "FAILED";
  }
  if (state !== "ACTIVE") throw new AiError(`Gemini couldn't process the file (${state}).`, "failed");
  return file;
}

/** Groq's hosted Whisper (whisper-large-v3-turbo): speech only, very fast. */
async function groqTranscribe(source: Extract<MediaSource, { kind: "file" }>, signal: AbortSignal) {
  const form = new FormData();
  form.append("file", new Blob([source.bytes as unknown as BlobPart], { type: source.mime }), source.name);
  form.append("model", process.env.GROQ_WHISPER_MODEL || "whisper-large-v3-turbo");
  form.append("response_format", "text");
  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: form,
    signal,
  });
  if (!res.ok) {
    console.error(`Groq transcription returned ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
    throw new AiError(`Groq returned ${res.status}.`, "failed");
  }
  const text = (await res.text()).trim();
  if (!text) throw new AiError("Groq returned no transcript.", "failed");
  return text;
}

/** Retries a call once, as the spec asks for model errors and timeouts. */
export async function withRetry<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    if (error instanceof AiError && error.code === "not-configured") throw error;
    return call();
  }
}

/** The first JSON object or array in a model reply, parsed; null when there is none. */
export function parseJson(text: string): unknown {
  const start = text.search(/[[{]/);
  if (start === -1) return null;
  const open = text[start];
  const end = text.lastIndexOf(open === "{" ? "}" : "]");
  if (end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * One Gemini call that heals itself: if the model isn't available to this key (404), it asks Google which
 * models are and takes the newest that fits the slot; if the model refuses the request (400, which Gemini
 * often reports without naming the field), it drops the thinking setting, then JSON mode; if the model is
 * busy (429, 500, 503, or no answer within OWN_MODEL_MS), it hands the call to the other Flash model and keeps
 * doing so for BUSY_MS. Lessons about models and settings are kept for the life of the server instance.
 */
async function gemini(
  slot: GeminiSlot,
  method: "generateContent" | "embedContent",
  body: (model: string) => unknown,
  signal: AbortSignal,
  { ownModelMs = OWN_MODEL_MS, standInOnTimeout = true }: { ownModelMs?: number; standInOnTimeout?: boolean } = {},
) {
  const key = process.env.GEMINI_API_KEY as string;
  const canStandIn = method === "generateContent";
  let model = geminiModels[slot] ?? GEMINI_DEFAULTS[slot];
  // The other tier's model stands in; when both tiers use the same model, Flash and Flash-Lite cover each other.
  const otherTier = geminiModels[slot === "fast" ? "smart" : "fast"] ?? GEMINI_DEFAULTS[slot === "fast" ? "smart" : "fast"];
  const standInFor = (busy: string) =>
    otherTier !== busy ? otherTier : busy === GEMINI_STAND_IN ? GEMINI_DEFAULTS.fast : GEMINI_STAND_IN;
  let standIn = false;
  if (canStandIn && (geminiBusyUntil.get(model) ?? 0) > Date.now()) {
    model = standInFor(model);
    standIn = true;
  }
  const handOff = (why: string) => {
    const next = standInFor(model);
    console.warn(`Gemini ${model} is busy (${why}); ${next} takes ${slot} calls for a while`);
    geminiBusyUntil.set(model, Date.now() + BUSY_MS);
    model = next;
    standIn = true;
  };

  for (let attempt = 0; attempt < 5; attempt++) {
    // The slot's own model gets a shorter leash, so a stand-in still has time to answer.
    const attemptSignal = canStandIn && !standIn ? AbortSignal.any([signal, AbortSignal.timeout(ownModelMs)]) : signal;
    let res: Response;
    try {
      res = await send(`${GEMINI_URL}/${model}:${method}`, { "x-goog-api-key": key }, body(model), attemptSignal);
    } catch (error) {
      if (canStandIn && !standIn && !signal.aborted && standInOnTimeout) {
        handOff("no answer in time");
        continue;
      }
      throw error;
    }
    if (res.ok) {
      if (!standIn && geminiModels[slot] !== model) console.info(`Gemini: ${model} answers for ${slot}`);
      if (!standIn) geminiModels[slot] = model;
      return res.json();
    }
    const detail = await res.text().catch(() => "");
    if ([429, 500, 503].includes(res.status) && canStandIn && !standIn) {
      handOff(String(res.status));
      continue;
    }
    if (res.status === 404) {
      const found = await geminiDiscover(slot, key);
      if (found && found !== model) {
        model = found;
        continue;
      }
    }
    if (res.status === 400 && method === "generateContent") {
      if (!geminiNoThinkingConfig.has(model)) {
        console.warn(`Gemini ${model} refused the request (${detail.slice(0, 160)}); retrying without a thinking budget`);
        geminiNoThinkingConfig.add(model);
        continue;
      }
      if (!geminiNoJsonMode.has(model)) {
        console.warn(`Gemini ${model} refused the request again; retrying without JSON mode`);
        geminiNoJsonMode.add(model);
        continue;
      }
    }
    console.error(`Gemini ${model} ${method} returned ${res.status}: ${detail.slice(0, 300)}`);
    throw new AiError(`Gemini returned ${res.status}.`, "failed");
  }
  throw new AiError("Gemini had no usable model.", "failed");
}

/** The newest model this key can use for the slot: Flash-Lite for fast, Flash for smart, a Gemini embedder. */
async function geminiDiscover(slot: GeminiSlot, key: string): Promise<string | null> {
  try {
    const res = await fetch(`${GEMINI_URL}?pageSize=1000`, {
      headers: { "x-goog-api-key": key },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const { models = [] } = (await res.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
    const list = models.map((m) => ({ id: m.name.replace(/^models\//, ""), methods: m.supportedGenerationMethods ?? [] }));
    const version = (id: string) => Number(id.match(/^gemini-(\d+(?:\.\d+)?)/)?.[1] ?? 0);
    const pool =
      slot === "embed"
        ? list.filter((m) => m.methods.includes("embedContent") && m.id.startsWith("gemini-embedding"))
        : list.filter(
            (m) =>
              m.methods.includes("generateContent") &&
              /^gemini-\d/.test(m.id) &&
              m.id.includes("flash") &&
              (slot === "fast") === m.id.includes("lite") &&
              !/(image|tts|audio|live|exp|thinking)/.test(m.id),
          );
    pool.sort((a, b) => version(b.id) - version(a.id) || Number(a.id.includes("preview")) - Number(b.id.includes("preview")));
    if (pool[0]) console.info(`Gemini: using ${pool[0].id} for ${slot}`);
    return pool[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function send(url: string, headers: Record<string, string>, body: unknown, signal: AbortSignal) {
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    const aborted = error instanceof DOMException && error.name === "AbortError";
    if (!aborted) console.error(`AI call to ${new URL(url).pathname} ${timedOut ? "timed out" : "failed to connect"}`);
    throw new AiError(timedOut ? "The AI provider timed out." : "The AI provider could not be reached.", "failed");
  }
}

async function post(url: string, headers: Record<string, string>, body: unknown, signal: AbortSignal) {
  const res = await send(url, headers, body, signal);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`AI provider ${new URL(url).host} returned ${res.status}: ${detail.slice(0, 300)}`);
    throw new AiError(`The AI provider returned ${res.status}.`, "failed");
  }
  return res.json();
}
