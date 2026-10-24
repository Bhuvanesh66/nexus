import { NextResponse } from "next/server";
import { checkPayload, type ActionKind, type ActionPayload, type ActionRecord } from "@/lib/actions";
import { aiConfigured, complete, parseJson, withRetry } from "@/lib/ai";
import { fail, isUuid, SIGNED_OUT } from "@/lib/http";
import { actionsPrompt } from "@/lib/prompts";
import { getSession } from "@/lib/supabase/server";

export const maxDuration = 60;

const COLUMNS = "id, ask_id, kind, title, payload, status, result, error, created_at, executed_at";

type Proposal = { kind: ActionKind; title: string; payload: ActionPayload };

const stripMarkup = (text: string) =>
  text
    .replace(/\s?\[#\d+\]/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .trim();

/** The Draft Email mode already wrote the email: offer to send exactly that, to whoever the task names. */
function emailFromDraft(task: string, response: string): Proposal {
  const lines = stripMarkup(response).split("\n");
  const at = lines.findIndex((l) => /^\s*subject\s*:/i.test(l));
  const subject = at >= 0 ? lines[at].replace(/^\s*subject\s*:\s*/i, "").trim() : "";
  const body = (at >= 0 ? lines.slice(at + 1) : lines).join("\n").trim();
  const to = `${task}\n${response}`.match(/[^\s@<>(),;:"']+@[^\s@<>(),;:"']+\.[a-z]{2,}/i)?.[0] ?? "";
  return {
    kind: "send_email",
    title: subject ? `Send “${subject.slice(0, 80)}”` : "Send this email",
    payload: { to, cc: [], subject, body },
  };
}

/** The user's recent actions, newest first: the action log. */
export async function GET() {
  const session = await getSession();
  if (!session) return SIGNED_OUT();
  const { data, error } = await session.supabase
    .from("actions")
    .select(COLUMNS)
    .neq("status", "proposed")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) return fail(500, "load-failed", "Your action log didn’t load.");
  return NextResponse.json({ actions: data ?? [] }, { headers: { "cache-control": "no-store" } });
}

/**
 * Proposes actions for one finished hand-off (idempotent: a second call returns the same proposals). Nothing
 * runs here; every action waits for the user to approve it.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return SIGNED_OUT();
  const { supabase, user } = session;

  const body = (await request.json().catch(() => null)) as { askId?: unknown; timezone?: unknown } | null;
  const askId = typeof body?.askId === "string" && isUuid(body.askId) ? body.askId : null;
  if (!askId) return fail(400, "bad-ask", "That hand-off isn’t in your history.");
  const timezone =
    typeof body?.timezone === "string" && /^[A-Za-z_]+(\/[A-Za-z0-9_+-]+){0,2}$/.test(body.timezone)
      ? body.timezone
      : "Asia/Kolkata";

  const { data: existing } = await supabase.from("actions").select(COLUMNS).eq("ask_id", askId).order("created_at");
  if (existing?.length) return NextResponse.json({ actions: existing });

  const { data: ask } = await supabase.from("asks").select("id, task, mode, response").eq("id", askId).maybeSingle();
  if (!ask?.response) return fail(404, "bad-ask", "That hand-off isn’t in your history.");

  const proposals: Proposal[] = [];
  if (ask.mode === "Draft Email") {
    proposals.push(emailFromDraft(ask.task, ask.response));
  } else if (aiConfigured()) {
    const today = new Date().toLocaleDateString("en-GB", {
      timeZone: timezone,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    try {
      const reply = await withRetry(() =>
        complete({
          prompt: actionsPrompt({ task: ask.task, response: stripMarkup(ask.response), today, timezone }),
          tier: "fast",
          maxTokens: 1800,
          json: true,
        }),
      );
      const parsed = parseJson(reply) as { actions?: unknown } | null;
      for (const item of Array.isArray(parsed?.actions) ? parsed.actions.slice(0, 3) : []) {
        const a = item as { kind?: unknown; title?: unknown; payload?: unknown };
        if (a.kind !== "send_email" && a.kind !== "create_event") continue;
        const payload = a.kind === "create_event" ? { ...(a.payload as object), timezone } : a.payload;
        const checked = checkPayload(a.kind, payload, false);
        if (!checked.ok) continue;
        const title = typeof a.title === "string" && a.title.trim() ? a.title.trim().slice(0, 120) : "Do this";
        proposals.push({ kind: a.kind, title, payload: checked.payload });
      }
    } catch {
      return fail(502, "ai-failed", "Nexus couldn’t work out the next steps just now. Try again in a moment.");
    }
  }

  if (!proposals.length) return NextResponse.json({ actions: [] });
  const { data: saved, error } = await supabase
    .from("actions")
    .insert(proposals.map((p) => ({ user_id: user.id, ask_id: askId, ...p })))
    .select(COLUMNS);
  if (error) {
    console.error("actions insert failed", error.message);
    return fail(500, "save-failed", "Nexus couldn’t save the suggested actions.");
  }
  return NextResponse.json({ actions: (saved ?? []) as ActionRecord[] }, { headers: { "cache-control": "no-store" } });
}
