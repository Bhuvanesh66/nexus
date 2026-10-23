import { NextResponse } from "next/server";
import { aiConfigured, complete, embed, embeddingsConfigured, withRetry } from "@/lib/ai";
import { fail, SIGNED_OUT } from "@/lib/http";
import { searchTerms } from "@/lib/ingest/basic";
import { askPrompt, MODES, type Mode } from "@/lib/prompts";
import { getSession } from "@/lib/supabase/server";
import type { AskRecord, AskSource, CaptureType } from "@/lib/vault";

export const maxDuration = 60;

const TOP = 8;
const THRESHOLD = 0.6;
const BACKFILL_THRESHOLD = 0.4;

type Hit = {
  id: string;
  type: CaptureType;
  title: string;
  summary: string;
  entities: string[];
  source_url: string | null;
  created_at: string;
};

const toSource = (hit: Pick<Hit, "id" | "title" | "type" | "source_url">, n: number): AskSource => ({
  n,
  id: hit.id,
  title: hit.title,
  type: hit.type,
  source_url: hit.source_url,
});

/**
 * Renumbers the [#n] citations in order of first use, keeping only captures the model actually cited, so the
 * Sources list is exactly what fed the answer. Citations to numbers that were never retrieved are dropped.
 */
function citeInOrder(response: string, hits: Hit[]) {
  const order: number[] = [];
  const text = response.replace(/\[((?:\s*#\d+\s*,?)+)\]/g, (_, inner: string) => {
    const cited = [...inner.matchAll(/#(\d+)/g)].map((m) => Number(m[1])).filter((n) => n >= 1 && n <= hits.length);
    return cited
      .map((n) => {
        if (!order.includes(n)) order.push(n);
        return `[#${order.indexOf(n) + 1}]`;
      })
      .join("");
  });
  return { text, sources: order.map((n, i) => toSource(hits[n - 1], i + 1)) };
}

/** Hand off: retrieve the user's relevant fragments, then have the model do the task in the chosen mode (8.3). */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return SIGNED_OUT();
  const { supabase, user } = session;

  const body = (await request.json().catch(() => null)) as { task?: unknown; mode?: unknown } | null;
  const task = typeof body?.task === "string" ? body.task.trim() : "";
  const mode = (MODES as readonly string[]).includes(body?.mode as string) ? (body?.mode as Mode) : null;
  if (!task) return fail(400, "empty", "Tell Nexus what you want done first.");
  if (task.length > 2000) return fail(400, "too-long", "Keep the task under 2,000 characters.");
  if (!mode) return fail(400, "bad-mode", "Pick one of the five output modes.");

  // Surface: semantic matches above the threshold, backfilled from a looser threshold when there are few,
  // then names and keywords from the task as a backup, merged and de-duplicated.
  const hits: Hit[] = [];
  const add = (rows: Hit[] | null) => {
    for (const row of rows ?? []) if (hits.length < TOP && !hits.some((h) => h.id === row.id)) hits.push(row);
  };

  if (embeddingsConfigured()) {
    try {
      const vector = await embed(task, { purpose: "query", signal: request.signal });
      const match = (threshold: number) =>
        supabase.rpc("match_captures", {
          query_embedding: vector,
          match_threshold: threshold,
          match_count: TOP,
          for_user: user.id,
        });
      add((await match(THRESHOLD)).data as Hit[] | null);
      if (hits.length < 3) add((await match(BACKFILL_THRESHOLD)).data as Hit[] | null);
    } catch {
      // the keyword backup below still runs
    }
  }
  const terms = searchTerms(task);
  if (terms.length && hits.length < TOP) {
    const { data } = await supabase.rpc("keyword_captures", { terms, match_count: TOP });
    add(data as Hit[] | null);
  }

  if (!aiConfigured()) {
    return fail(503, "ai-not-configured", "Nexus’s AI isn’t connected yet, so it can’t write this for you.", {
      sources: hits.map((h, i) => toSource(h, i + 1)),
    });
  }

  let reply: string;
  try {
    reply = await withRetry(() =>
      complete({ prompt: askPrompt({ task, mode, captures: hits }), tier: "smart", maxTokens: 2000, signal: request.signal }),
    );
  } catch {
    return fail(502, "ai-failed", "Nexus’s AI is slow right now. Try again in a few seconds.");
  }

  const { text, sources } = citeInOrder(reply.trim(), hits);
  const { data: saved } = await supabase
    .from("asks")
    .insert({ user_id: user.id, task, mode, response: text, used_capture_ids: sources.map((s) => s.id) })
    .select("id, created_at")
    .single();

  const ask: AskRecord = {
    id: saved?.id ?? crypto.randomUUID(),
    task,
    mode,
    response: text,
    sources,
    general_only: sources.length === 0,
    created_at: saved?.created_at ?? new Date().toISOString(),
  };
  return NextResponse.json({ ask, checked: hits.length }, { headers: { "cache-control": "no-store" } });
}

/** The signed-in user's recent asks, newest first, with the fragments each one used. */
export async function GET() {
  const session = await getSession();
  if (!session) return SIGNED_OUT();
  const { supabase } = session;

  const { data: rows, error } = await supabase
    .from("asks")
    .select("id, task, mode, response, used_capture_ids, created_at")
    .not("response", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return fail(500, "load-failed", "Your past hand-offs didn’t load.");

  const ids = [...new Set((rows ?? []).flatMap((r) => r.used_capture_ids as string[]))];
  const { data: captures } = ids.length
    ? await supabase.from("captures").select("id, title, type, source_url").in("id", ids)
    : { data: [] };
  const byId = new Map((captures ?? []).map((c) => [c.id as string, c as Hit]));

  const asks: AskRecord[] = (rows ?? []).map((r) => {
    const used = r.used_capture_ids as string[];
    return {
      id: r.id,
      task: r.task,
      mode: r.mode,
      response: r.response ?? "",
      // Numbering follows the citations in the saved text; a fragment deleted since simply drops out.
      sources: used.flatMap((id, i) => {
        const hit = byId.get(id);
        return hit ? [toSource(hit, i + 1)] : [];
      }),
      general_only: used.length === 0,
      created_at: r.created_at,
    };
  });

  return NextResponse.json({ asks }, { headers: { "cache-control": "no-store" } });
}
