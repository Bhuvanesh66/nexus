/**
 * The execution layer's shared rules: what Nexus can do, what a valid request for each looks like, and links
 * that open the same thing in Gmail or Google Calendar for the user to finish by hand. Safe on the client.
 */

export type ActionKind = "send_email" | "create_draft" | "create_event";
export type ActionStatus = "proposed" | "approved" | "done" | "failed" | "dismissed";
export type Toolkit = "gmail" | "googlecalendar";

export type EmailPayload = { to: string; cc: string[]; subject: string; body: string };
export type EventPayload = {
  title: string;
  /** Local wall-clock time, YYYY-MM-DDTHH:MM, in `timezone`. */
  start: string;
  duration_minutes: number;
  timezone: string;
  attendees: string[];
  description: string;
  location: string;
};
export type ActionPayload = EmailPayload | EventPayload;

export type ActionRecord = {
  id: string;
  ask_id: string | null;
  kind: ActionKind;
  title: string;
  payload: ActionPayload;
  status: ActionStatus;
  result: { link?: string | null; note?: string | null } | null;
  error: string | null;
  created_at: string;
  executed_at: string | null;
};

export const TOOLKIT_OF: Record<ActionKind, Toolkit> = {
  send_email: "gmail",
  create_draft: "gmail",
  create_event: "googlecalendar",
};

export const TOOLKIT_LABEL: Record<Toolkit, string> = { gmail: "Gmail", googlecalendar: "Google Calendar" };

export const isEmailKind = (kind: ActionKind) => kind === "send_email" || kind === "create_draft";

const EMAIL = /^[^\s@<>(),;:"']+@[^\s@<>(),;:"']+\.[a-z]{2,}$/i;

/** Email addresses from a list or a comma-separated string; null when any of them is not an address. */
export function parseEmails(value: unknown, max = 20): string[] | null {
  const list = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[,;\s]+/) : [];
  const clean = list.map((v) => (typeof v === "string" ? v.trim() : "")).filter(Boolean);
  if (clean.length > max || clean.some((v) => !EMAIL.test(v))) return null;
  return [...new Set(clean.map((v) => v.toLowerCase()))];
}

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/**
 * Checks a payload for its kind. `strict` is for approval (everything needed to act must be there and valid);
 * proposals may leave the recipient empty for the user to fill in.
 */
export function checkPayload(
  kind: ActionKind,
  value: unknown,
  strict: boolean,
): { ok: true; payload: ActionPayload } | { ok: false; message: string } {
  const v = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;

  if (isEmailKind(kind)) {
    const to = text(v.to, 320);
    const cc = parseEmails(v.cc ?? []);
    const subject = text(v.subject, 200);
    const body = text(v.body, 20_000);
    if (to && !EMAIL.test(to)) return { ok: false, message: "The “To” address doesn’t look like an email address." };
    if (cc === null) return { ok: false, message: "One of the Cc addresses doesn’t look like an email address." };
    if (strict && kind === "send_email" && !to) return { ok: false, message: "Add who the email goes to." };
    if (!subject && !body) return { ok: false, message: "The email needs a subject or a message." };
    return { ok: true, payload: { to, cc, subject, body } };
  }

  const title = text(v.title, 200);
  const start = text(v.start, 16);
  const duration = Math.round(Number(v.duration_minutes));
  const timezone = text(v.timezone, 64) || "Asia/Kolkata";
  const attendees = parseEmails(v.attendees ?? []);
  if (!title) return { ok: false, message: "Give the event a title." };
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(start) || Number.isNaN(Date.parse(`${start}:00Z`))) {
    return { ok: false, message: "Pick a date and time for the event." };
  }
  if (!Number.isFinite(duration) || duration < 5 || duration > 1440) {
    return { ok: false, message: "The event should last between 5 minutes and 24 hours." };
  }
  if (!/^[A-Za-z_]+(\/[A-Za-z0-9_+-]+){0,2}$/.test(timezone)) return { ok: false, message: "That time zone isn’t recognised." };
  if (attendees === null) return { ok: false, message: "One of the guests doesn’t look like an email address." };
  return {
    ok: true,
    payload: {
      title,
      start,
      duration_minutes: duration,
      timezone,
      attendees,
      description: text(v.description, 5000),
      location: text(v.location, 300),
    },
  };
}

/** Wall-clock arithmetic on YYYY-MM-DDTHH:MM, with no time-zone conversion. */
export function addMinutes(start: string, minutes: number) {
  const t = new Date(Date.parse(`${start}:00Z`) + minutes * 60_000);
  return t.toISOString().slice(0, 16);
}

const compact = (local: string) => `${local.replace(/[-:]/g, "")}00`;

/** Google Calendar's "new event" page with everything filled in; the user presses Save. */
export function calendarTemplateUrl(p: EventPayload) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: p.title,
    dates: `${compact(p.start)}/${compact(addMinutes(p.start, p.duration_minutes))}`,
    ctz: p.timezone,
  });
  if (p.description) params.set("details", p.description);
  if (p.location) params.set("location", p.location);
  if (p.attendees.length) params.set("add", p.attendees.join(","));
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Gmail's compose window with the email filled in; the user presses Send. */
export function gmailComposeFor(p: EmailPayload) {
  const params = new URLSearchParams({ view: "cm", fs: "1", su: p.subject, body: p.body });
  if (p.to) params.set("to", p.to);
  if (p.cc.length) params.set("cc", p.cc.join(","));
  return `https://mail.google.com/mail/?${params.toString().replace(/\+/g, "%20")}`;
}

/** "Fri 24 Oct, 10:00" for a local wall-clock time. */
export function formatLocal(start: string) {
  const d = new Date(Date.parse(`${start}:00Z`));
  return d.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}
