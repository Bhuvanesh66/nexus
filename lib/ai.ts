/**
 * The two AI calls Nexus makes: Claude for text, OpenAI text-embedding-3-small (1536 dimensions) for vectors.
 *
 * Providers, first one configured wins:
 *   Claude      ANTHROPIC_API_KEY → Anthropic Messages API; else Vercel AI Gateway
 *   Embeddings  OPENAI_API_KEY    → OpenAI; else Vercel AI Gateway
 * The gateway is used with AI_GATEWAY_API_KEY, or with the deployment's OIDC token when AI_GATEWAY_USE_OIDC=1
 * (the team needs a card on file for the gateway either way). Keys are read on the server only.
 */

export type ModelTier = "fast" | "smart";

const ANTHROPIC_MODELS: Record<ModelTier, string> = { fast: "claude-haiku-5-5", smart: "claude-sonnet-5-5" };
const GATEWAY_MODELS: Record<ModelTier, string> = {
  fast: "anthropic/claude-haiku-5.5",
  smart: "anthropic/claude-sonnet-5.5",
};
const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1";
const EMBEDDING_DIMENSIONS = 1536;

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

export function claudeConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY || gatewayToken());
}

export function embeddingsConfigured() {
  return Boolean(process.env.OPENAI_API_KEY || gatewayToken());
}

/** One Claude completion; returns the text. Throws AiError. */
export async function complete({
  prompt,
  tier,
  maxTokens,
  signal,
}: {
  prompt: string;
  tier: ModelTier;
  maxTokens: number;
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
    if (!text) throw new AiError("Claude returned no text.", "failed");
    return text;
  }

  const token = gatewayToken();
  if (!token) throw new AiError("No Claude provider is configured.", "not-configured");
  const res = await post(
    `${GATEWAY_URL}/chat/completions`,
    { authorization: `Bearer ${token}` },
    { model: GATEWAY_MODELS[tier], max_tokens: maxTokens, messages },
    abort,
  );
  const text = (res as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content;
  if (!text) throw new AiError("Claude returned no text.", "failed");
  return text;
}

/** One embedding vector for the text. Throws AiError. */
export async function embed(text: string, signal?: AbortSignal): Promise<number[]> {
  const input = text.slice(0, 8000);
  const timeout = AbortSignal.timeout(20_000);
  const abort = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let res: unknown;
  if (process.env.OPENAI_API_KEY) {
    res = await post(
      "https://api.openai.com/v1/embeddings",
      { authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      { model: "text-embedding-3-small", input },
      abort,
    );
  } else {
    const token = gatewayToken();
    if (!token) throw new AiError("No embedding provider is configured.", "not-configured");
    res = await post(
      `${GATEWAY_URL}/embeddings`,
      { authorization: `Bearer ${token}` },
      { model: "openai/text-embedding-3-small", input },
      abort,
    );
  }

  const vector = (res as { data?: { embedding?: number[] }[] }).data?.[0]?.embedding;
  if (!vector || vector.length !== EMBEDDING_DIMENSIONS) throw new AiError("The embedding came back malformed.", "failed");
  return vector;
}

/** Retries a call once, as the spec asks for Claude errors and timeouts. */
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

async function post(url: string, headers: Record<string, string>, body: unknown, signal: AbortSignal) {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    throw new AiError(timedOut ? "The AI provider timed out." : "The AI provider could not be reached.", "failed");
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`AI provider ${new URL(url).host} returned ${res.status}: ${detail.slice(0, 300)}`);
    throw new AiError(`The AI provider returned ${res.status}.`, "failed");
  }
  return res.json();
}
