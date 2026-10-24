/**
 * Supadata (supadata.ai): a hosted API that returns the caption, author and a speech transcript of public
 * Instagram, TikTok, Facebook and X videos. Nexus uses it for reel links, which those platforms don't let apps
 * read themselves. Server only, with SUPADATA_API_KEY. Costs: metadata 1 credit; transcript 1 credit when the
 * platform has captions, otherwise 2 credits per minute of video (generated).
 */

const BASE = "https://api.supadata.ai/v1";

export function supadataConfigured() {
  return Boolean(process.env.SUPADATA_API_KEY);
}

export type SupadataReel = {
  title: string | null;
  caption: string | null;
  author: string | null;
  durationSeconds: number | null;
  transcript: string | null;
  /** Why there is no transcript, when there isn't one. */
  problem: "private" | "no-speech" | "failed" | null;
};

async function call(path: string, signal: AbortSignal) {
  return fetch(`${BASE}${path}`, { headers: { "x-api-key": process.env.SUPADATA_API_KEY as string }, signal });
}

async function metadata(url: string, signal: AbortSignal) {
  try {
    const res = await call(`/metadata?url=${encodeURIComponent(url)}`, signal);
    if (!res.ok) return null;
    const body = (await res.json()) as {
      title?: string | null;
      description?: string | null;
      author?: { displayName?: string | null; username?: string | null } | null;
      media?: { duration?: number | null } | null;
    };
    return {
      title: body.title?.trim() || null,
      caption: body.description?.trim() || null,
      author: body.author?.displayName?.trim() || body.author?.username?.trim() || null,
      durationSeconds: typeof body.media?.duration === "number" ? body.media.duration : null,
    };
  } catch {
    return null;
  }
}

async function transcript(url: string, signal: AbortSignal): Promise<Pick<SupadataReel, "transcript" | "problem">> {
  try {
    const res = await call(`/transcript?url=${encodeURIComponent(url)}&text=true&mode=auto`, signal);
    if (res.status === 206) return { transcript: null, problem: "no-speech" };
    if (res.status === 403 || res.status === 404) return { transcript: null, problem: "private" };
    if (res.status === 200) {
      const body = (await res.json()) as { content?: string };
      const text = typeof body.content === "string" ? body.content.trim() : "";
      return text ? { transcript: text, problem: null } : { transcript: null, problem: "no-speech" };
    }
    if (res.status === 202) {
      // Longer videos are transcribed as a job; poll about once a second, as the docs suggest.
      const { jobId } = (await res.json()) as { jobId?: string };
      if (!jobId) return { transcript: null, problem: "failed" };
      for (let i = 0; i < 90; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const poll = await call(`/transcript/${encodeURIComponent(jobId)}`, signal);
        if (!poll.ok) return { transcript: null, problem: "failed" };
        const job = (await poll.json()) as { status?: string; content?: string | { text?: string }[] };
        if (job.status === "failed") return { transcript: null, problem: "failed" };
        if (job.status === "completed") {
          const text = (
            typeof job.content === "string" ? job.content : (job.content ?? []).map((c) => c.text ?? "").join(" ")
          ).trim();
          return text ? { transcript: text, problem: null } : { transcript: null, problem: "no-speech" };
        }
      }
      return { transcript: null, problem: "failed" };
    }
    console.error(`Supadata transcript returned ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
    return { transcript: null, problem: "failed" };
  } catch {
    return { transcript: null, problem: "failed" };
  }
}

/** Caption, author and transcript of a public short video, fetched in parallel; null when nothing came back. */
export async function supadataReel(url: string): Promise<SupadataReel | null> {
  const signal = AbortSignal.timeout(120_000);
  const [meta, words] = await Promise.all([metadata(url, signal), transcript(url, signal)]);
  if (!meta && !words.transcript) return words.problem === "private" ? { ...empty(), problem: "private" } : null;
  return { ...empty(), ...meta, ...words };
}

function empty(): SupadataReel {
  return { title: null, caption: null, author: null, durationSeconds: null, transcript: null, problem: null };
}
