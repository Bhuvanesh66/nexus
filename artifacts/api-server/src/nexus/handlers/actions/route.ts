import { checkPayload, type ActionKind, type ActionPayload, type ActionRecord } from "@/lib/actions";
import { agentCogConfigured, agentCogDraft } from "@/lib/agenticorg";
import { aiConfigured, complete, parseJson, withRetry } from "@/lib/ai";
import { fail, isUuid, SIGNED_OUT } from "@/lib/http";
import { logger } from "@/lib/logger";
import { actionsPrompt } from "@/lib/prompts";
import { getSession } from "@/lib/supabase/server";


const COLUMNS = "id, ask_id, kind, title, payload, status, result, error, created_at, executed_at";

type Proposal = { kind: ActionKind; title: string; payload: ActionPayload };

const stripMarkup = (text: string) =>
  text
    .replace(/\s?\[#\d+\]/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .trim();

const ADDRESS = /[^\s@<>(),;:"']+@[^\s@<>(),;:"']+\.[a-z]{2,}/gi;

/**
 * Who the email is for: an address in the task or the draft, or else in the fragments the hand-off used,
 * preferring one whose name part appears in the task ("Email Kavya…" → kavya@…). Empty when unsure.
 */
function recipient(task: string, response: string, fragments: string) {
  const direct = `${task}\n${response}`.match(ADDRESS);
  if (direct?.length) return direct[0];
  const found = [...new Set((fragments.match(ADDRESS) ?? []).map((a) => a.toLowerCase()))];
  if (found.length === 1) return found[0];
  const words = task.toLowerCase().match(/[a-z]{3,}/g) ?? [];
  return found.find((a) => words.some((w) => a.split("@")[0].includes(w))) ?? "";
}

/** The Draft Email mode already wrote the email: offer to send exactly that, to whoever the task names. */
function emailFromDraft(task: string, response: string, fragments: string): Proposal {
  const lines = stripMarkup(response).split("\n");
  const at = lines.findIndex((l) => /^\s*subject\s*:/i.test(l));
  const subject = at >= 0 ? lines[at].replace(/^\s*subject\s*:\s*/i, "").trim() : "";
  const body = (at >= 0 ? lines.slice(at + 1) : lines).join("\n").trim();
  const to = recipient(task, response, fragments);
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
  return Response.json({ actions: data ?? [] }, { headers: { "cache-control": "no-store" } });
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
  if (existing?.length) return Response.json({ actions: existing });

  const { data: ask } = await supabase
    .from("asks")
    .select("id, task, mode, response, used_capture_ids")
    .eq("id", askId)
    .maybeSingle();
  if (!ask?.response) return fail(404, "bad-ask", "That hand-off isn’t in your history.");

  let draftResponse: string = ask.response;
  if (agentCogConfigured()) {
    try {
      const { output } = await agentCogDraft(ask.task, { response: stripMarkup(ask.response) });
      const draft =
        typeof output === "string"
          ? output
          : output !== null && typeof output === "object"
            ? JSON.stringify(output)
            : undefined;
      if (typeof draft === "string" && draft.trim()) draftResponse = draft;
    } catch {
      // Drafting is optional: silently keep the original hand-off on any failure.
    }
  }

  const proposals: Proposal[] = [];
  if (ask.mode === "Draft Email") {
    const used = (ask.used_capture_ids as string[] | null) ?? [];
    const { data: sources } = used.length
      ? await supabase.from("captures").select("raw_content, summary").in("id", used)
      : { data: [] };
    const fragments = (sources ?? []).map((s) => `${s.summary}\n${s.raw_content}`).join("\n");
    proposals.push(emailFromDraft(ask.task, draftResponse, fragments));
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
          prompt: actionsPrompt({ task: ask.task, response: stripMarkup(draftResponse), today, timezone }),
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

  if (!proposals.length) return Response.json({ actions: [] });
  const { data: saved, error } = await supabase
    .from("actions")
    .insert(proposals.map((p) => ({ user_id: user.id, ask_id: askId, ...p })))
    .select(COLUMNS);
  if (error) {
    logger.error({ message: error.message }, "actions insert failed");
    return fail(500, "save-failed", "Nexus couldn’t save the suggested actions.");
  }
  return Response.json({ actions: (saved ?? []) as ActionRecord[] }, { headers: { "cache-control": "no-store" } });
}
