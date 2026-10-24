import {
  addMinutes,
  checkPayload,
  isEmailKind,
  TOOLKIT_LABEL,
  TOOLKIT_OF,
  type ActionKind,
  type EmailPayload,
  type EventPayload,
} from "@/lib/actions";
import { ComposioError, composioConfigured, connectedToolkits, executeTool, findKey } from "@/lib/composio";
import { fail, isUuid, SIGNED_OUT } from "@/lib/http";
import { getSession } from "@/lib/supabase/server";


const COLUMNS = "id, ask_id, kind, title, payload, status, result, error, created_at, executed_at";
const DAILY_LIMIT = 40;

type Params = { params: Promise<{ id: string }> };

/** The Composio tool and arguments for exactly what the user approved. */
function toolCall(kind: ActionKind, payload: EmailPayload | EventPayload) {
  if (kind === "create_event") {
    const p = payload as EventPayload;
    return {
      slug: "GOOGLECALENDAR_CREATE_EVENT",
      args: {
        calendar_id: "primary",
        summary: p.title,
        start_datetime: `${p.start}:00`,
        end_datetime: `${addMinutes(p.start, p.duration_minutes)}:00`,
        timezone: p.timezone,
        description: p.description || undefined,
        location: p.location || undefined,
        attendees: p.attendees.length ? p.attendees : undefined,
        send_updates: p.attendees.length ? "all" : "none",
        create_meeting_room: p.attendees.length > 0,
      },
    };
  }
  const p = payload as EmailPayload;
  return {
    slug: kind === "send_email" ? "GMAIL_SEND_EMAIL" : "GMAIL_CREATE_EMAIL_DRAFT",
    args: {
      recipient_email: p.to || undefined,
      cc: p.cc.length ? p.cc : undefined,
      subject: p.subject,
      body: p.body,
      is_html: false,
    },
  };
}

/**
 * Approve or dismiss one proposed action. Approval stores exactly what the user approved, then runs that and
 * nothing else in the user's own connected app, and records the outcome in the action log.
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  if (!isUuid(id)) return fail(404, "not-found", "That action isn’t in your list.");
  const session = await getSession();
  if (!session) return SIGNED_OUT();
  const { supabase, user } = session;

  const body = (await request.json().catch(() => null)) as {
    decision?: unknown;
    payload?: unknown;
    kind?: unknown;
  } | null;
  const { data: row } = await supabase.from("actions").select(COLUMNS).eq("id", id).maybeSingle();
  if (!row) return fail(404, "not-found", "That action isn’t in your list.");
  if (row.status !== "proposed" && row.status !== "failed") {
    return fail(409, "already-handled", "This action has already been handled.");
  }

  if (body?.decision === "dismiss") {
    const { data } = await supabase.from("actions").update({ status: "dismissed" }).eq("id", id).select(COLUMNS).single();
    return Response.json({ action: data });
  }
  if (body?.decision !== "approve") return fail(400, "bad-decision", "Approve or dismiss the action.");

  // An email may be switched between sending and saving as a draft; nothing else can change kind.
  const kind: ActionKind =
    isEmailKind(row.kind) && (body.kind === "send_email" || body.kind === "create_draft") ? body.kind : row.kind;
  const checked = checkPayload(kind, body.payload, true);
  if (!checked.ok) return fail(400, "bad-payload", checked.message);

  if (!composioConfigured()) {
    return fail(503, "not-configured", "Nexus can’t act in your apps on this deployment yet.");
  }

  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { count } = await supabase
    .from("actions")
    .select("id", { count: "exact", head: true })
    .eq("status", "done")
    .gte("executed_at", since);
  if ((count ?? 0) >= DAILY_LIMIT) {
    return fail(429, "daily-limit", `Nexus has done ${DAILY_LIMIT} things for you in the last day. Try again tomorrow.`);
  }

  const toolkit = TOOLKIT_OF[kind];
  try {
    const connected = await connectedToolkits(user.id);
    if (!connected[toolkit]) {
      return fail(409, "not-connected", `Connect ${TOOLKIT_LABEL[toolkit]} first, then approve again.`, { toolkit });
    }
  } catch {
    return fail(502, "connections-failed", "Nexus couldn’t check your connected apps just now. Try again.");
  }

  // Record the approval before acting, so the log shows what was approved even if the call fails midway.
  await supabase
    .from("actions")
    .update({ kind, payload: checked.payload, status: "approved", approved_at: new Date().toISOString(), error: null })
    .eq("id", id);

  const { slug, args } = toolCall(kind, checked.payload);
  let status: "done" | "failed" = "failed";
  let result: { link: string | null; note: string | null } | null = null;
  let errorText: string | null = null;
  try {
    const run = await executeTool(user.id, slug, args);
    if (run.successful) {
      status = "done";
      const eventLink = kind === "create_event" ? findKey(run.data, "htmlLink") : undefined;
      result = {
        link:
          typeof eventLink === "string"
            ? eventLink
            : kind === "send_email"
              ? "https://mail.google.com/mail/u/0/#sent"
              : kind === "create_draft"
                ? "https://mail.google.com/mail/u/0/#drafts"
                : null,
        note: run.log_id ? `Composio log ${run.log_id}` : null,
      };
    } else {
      errorText = `${TOOLKIT_LABEL[toolkit]} didn’t accept it: ${(run.error ?? "no reason given").slice(0, 240)}`;
    }
  } catch (error) {
    const status = error instanceof ComposioError ? error.status : 0;
    errorText =
      status === 0
        ? "Nexus couldn’t reach Composio. Nothing was sent; try again."
        : status >= 400 && status < 500
          ? `Composio didn’t accept the request (${status}). Nothing was sent; check the details and try again.`
          : `${TOOLKIT_LABEL[toolkit]} didn’t respond. Check ${TOOLKIT_LABEL[toolkit]} before trying again, in case it went through.`;
  }

  // A failed action is still a normal answer: the card shows what went wrong and offers to try again.
  const { data: done } = await supabase
    .from("actions")
    .update({ status, result, error: errorText, executed_at: new Date().toISOString() })
    .eq("id", id)
    .select(COLUMNS)
    .single();
  return Response.json({ action: done }, { headers: { "cache-control": "no-store" } });
}
