
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowIcon, CheckIcon } from "@/components/icons";
import {
  calendarTemplateUrl,
  formatLocal,
  gmailComposeFor,
  isEmailKind,
  TOOLKIT_LABEL,
  TOOLKIT_OF,
  type ActionKind,
  type ActionRecord,
  type EmailPayload,
  type EventPayload,
  type Toolkit,
} from "@/lib/actions";
import styles from "./app.module.css";
import { api } from "./shared";

type Connections = { configured: boolean; toolkits: Record<Toolkit, boolean> };

// One check per page load, shared by every card; refreshed while a connect window is open.
let connectionsPromise: Promise<Connections | null> | null = null;
function loadConnections(fresh = false) {
  if (!connectionsPromise || fresh) {
    connectionsPromise = api<Connections>("/api/connections").then((r) => (r.ok ? r.data : null));
  }
  return connectionsPromise;
}

async function fetchProposals(askId: string) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
  const [res, conn] = await Promise.all([
    api<{ actions: ActionRecord[] }>("/api/actions", { method: "POST", body: JSON.stringify({ askId, timezone }) }),
    loadConnections(),
  ]);
  return { res, conn };
}

/**
 * "Nexus can do this for you": the actions Nexus proposes for one hand-off, each one waiting for the user to
 * read it, edit it if they like, and approve it. Nothing runs without that approval.
 */
export function ActionCards({ askId, auto, onChanged }: { askId: string; auto: boolean; onChanged?: () => void }) {
  const [phase, setPhase] = useState<"idle" | "loading" | "ready" | "error">(auto ? "loading" : "idle");
  const [actions, setActions] = useState<ActionRecord[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connections | null>(null);

  const apply = useCallback(({ res, conn }: Awaited<ReturnType<typeof fetchProposals>>) => {
    setConnections(conn);
    if (res.ok) {
      setActions(res.data.actions);
      setPhase("ready");
    } else {
      setMessage(res.error.message);
      setPhase("error");
    }
  }, []);

  const propose = async () => {
    setPhase("loading");
    setMessage(null);
    apply(await fetchProposals(askId));
  };

  useEffect(() => {
    if (!auto) return;
    let live = true;
    void fetchProposals(askId).then((result) => {
      if (live) apply(result);
    });
    return () => {
      live = false;
    };
  }, [auto, askId, apply]);

  const replace = (next: ActionRecord) => {
    setActions((list) => list.map((a) => (a.id === next.id ? next : a)));
    onChanged?.();
  };

  return (
    <section className={styles.doIt} aria-label="What Nexus can do with this">
      {phase === "idle" ? (
        <button type="button" className={styles.quiet} onClick={() => void propose()}>
          What can Nexus do with this?
        </button>
      ) : phase === "loading" ? (
        <p className={styles.small} role="status">
          Working out what Nexus can do for you…
        </p>
      ) : phase === "error" ? (
        <p className={styles.small} role="alert">
          {message}{" "}
          <button type="button" className={styles.textButton} onClick={() => void propose()}>
            Try again
          </button>
        </p>
      ) : actions.length === 0 ? (
        <p className={styles.small}>Nothing here for Nexus to do in your apps.</p>
      ) : (
        <>
          <h3 className={styles.doItHead}>Nexus can do this for you</h3>
          <p className={styles.small}>Check each one, change anything you like, and approve it. Nothing happens until you do.</p>
          <ul className={styles.actionList}>
            {actions.map((a) => (
              <li key={a.id}>
                <ActionCard
                  action={a}
                  connections={connections}
                  onChange={replace}
                  onConnections={setConnections}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function ActionCard({
  action,
  connections,
  onChange,
  onConnections,
}: {
  action: ActionRecord;
  connections: Connections | null;
  onChange: (a: ActionRecord) => void;
  onConnections: (c: Connections | null) => void;
}) {
  const [email, setEmail] = useState<EmailPayload>(() =>
    isEmailKind(action.kind) ? (action.payload as EmailPayload) : { to: "", cc: [], subject: "", body: "" },
  );
  const [event, setEvent] = useState<EventPayload>(() =>
    action.kind === "create_event"
      ? (action.payload as EventPayload)
      : { title: "", start: "", duration_minutes: 30, timezone: "Asia/Kolkata", attendees: [], description: "", location: "" },
  );
  const [ccText, setCcText] = useState(email.cc.join(", "));
  const [guestText, setGuestText] = useState(event.attendees.join(", "));
  const [busy, setBusy] = useState<ActionKind | "dismiss" | "connect" | null>(null);
  const [problem, setProblem] = useState<string | null>(action.status === "failed" ? action.error : null);
  const poll = useRef<number | null>(null);

  useEffect(() => () => void (poll.current && window.clearInterval(poll.current)), []);

  const toolkit = TOOLKIT_OF[action.kind];
  const configured = connections?.configured ?? false;
  const connected = connections?.toolkits[toolkit] ?? false;
  const isEmail = isEmailKind(action.kind);
  const split = (value: string) => value.split(/[,;\s]+/).map((v) => v.trim()).filter(Boolean);
  const emailNow = { ...email, cc: split(ccText) };
  const eventNow = { ...event, attendees: split(guestText) };

  async function decide(decision: "approve" | "dismiss", kind: ActionKind = action.kind) {
    setBusy(decision === "dismiss" ? "dismiss" : kind);
    setProblem(null);
    const res = await api<{ action: ActionRecord }>(`/api/actions/${action.id}`, {
      method: "POST",
      body: JSON.stringify({ decision, kind, payload: isEmail ? emailNow : eventNow }),
    });
    setBusy(null);
    if (res.ok) {
      onChange(res.data.action);
      if (res.data.action.status === "failed") setProblem(res.data.action.error);
    } else {
      setProblem(res.error.message);
      if (res.error.code === "not-connected") onConnections(await loadConnections(true));
    }
  }

  async function connect() {
    setBusy("connect");
    setProblem(null);
    const res = await api<{ url: string }>("/api/connections", { method: "POST", body: JSON.stringify({ toolkit }) });
    if (!res.ok) {
      setBusy(null);
      setProblem(res.error.message);
      return;
    }
    const popup = window.open(res.data.url, "nexus-connect", "width=520,height=720");
    if (!popup) {
      setBusy(null);
      setProblem("Your browser blocked the sign-in window. Allow pop-ups for Nexus and try again.");
      return;
    }
    // Watch for the new connection while the window is open, for up to five minutes.
    let checks = 0;
    poll.current = window.setInterval(async () => {
      checks += 1;
      const next = await loadConnections(true);
      if (next?.toolkits[toolkit] || checks > 120 || popup.closed) {
        if (poll.current) window.clearInterval(poll.current);
        poll.current = null;
        const final = next?.toolkits[toolkit] ? next : await loadConnections(true);
        onConnections(final);
        setBusy(null);
      }
    }, 2500);
  }

  if (action.status === "dismissed") {
    return (
      <div className={styles.actionCard} data-status="dismissed">
        <p className={styles.small}>Dismissed: {action.title}</p>
      </div>
    );
  }

  if (action.status === "done") {
    const done =
      action.kind === "send_email"
        ? "Sent from your Gmail"
        : action.kind === "create_draft"
          ? "Saved as a draft in your Gmail"
          : "Added to your Google Calendar";
    return (
      <div className={styles.actionCard} data-status="done">
        <p className={styles.actionDone}>
          <CheckIcon size={16} /> {done}: <strong>{action.title}</strong>
          {action.result?.link ? (
            <a href={action.result.link} target="_blank" rel="noopener noreferrer">
              Open ↗
            </a>
          ) : null}
        </p>
      </div>
    );
  }

  const fid = (name: string) => `${action.id}-${name}`;

  return (
    <div className={styles.actionCard} data-status={action.status}>
      <p className={styles.actionTitle}>
        <span className={styles.actionApp}>{TOOLKIT_LABEL[toolkit]}</span>
        {action.title}
      </p>

      {isEmail ? (
        <div className={styles.actionFields}>
          <label htmlFor={fid("to")}>To</label>
          <input
            id={fid("to")}
            type="email"
            value={email.to}
            placeholder="name@example.com"
            onChange={(e) => setEmail({ ...email, to: e.target.value })}
          />
          <label htmlFor={fid("cc")}>Cc</label>
          <input id={fid("cc")} value={ccText} placeholder="optional" onChange={(e) => setCcText(e.target.value)} />
          <label htmlFor={fid("subject")}>Subject</label>
          <input id={fid("subject")} value={email.subject} onChange={(e) => setEmail({ ...email, subject: e.target.value })} />
          <label htmlFor={fid("body")}>Message</label>
          <textarea id={fid("body")} rows={8} value={email.body} onChange={(e) => setEmail({ ...email, body: e.target.value })} />
        </div>
      ) : (
        <div className={styles.actionFields}>
          <label htmlFor={fid("title")}>Title</label>
          <input id={fid("title")} value={event.title} onChange={(e) => setEvent({ ...event, title: e.target.value })} />
          <label htmlFor={fid("start")}>When</label>
          <span className={styles.whenRow}>
            <input
              id={fid("start")}
              type="datetime-local"
              value={event.start}
              onChange={(e) => setEvent({ ...event, start: e.target.value.slice(0, 16) })}
            />
            <select
              aria-label="How long"
              value={event.duration_minutes}
              onChange={(e) => setEvent({ ...event, duration_minutes: Number(e.target.value) })}
            >
              {[15, 30, 45, 60, 90, 120, 180, 240].map((m) => (
                <option key={m} value={m}>
                  {m < 60 ? `${m} min` : `${m / 60} h`}
                </option>
              ))}
            </select>
          </span>
          <label htmlFor={fid("guests")}>Guests</label>
          <input id={fid("guests")} value={guestText} placeholder="optional, email addresses" onChange={(e) => setGuestText(e.target.value)} />
          <label htmlFor={fid("desc")}>Notes</label>
          <textarea id={fid("desc")} rows={3} value={event.description} onChange={(e) => setEvent({ ...event, description: e.target.value })} />
          <span className={styles.small}>
            {event.start ? formatLocal(event.start) : "No time yet"} · {event.timezone}
          </span>
        </div>
      )}

      {problem ? (
        <p className={styles.errorText} role="alert">
          {problem}
        </p>
      ) : null}

      {!configured ? (
        <div className={styles.actions}>
          <a
            className="button"
            href={isEmail ? gmailComposeFor(emailNow) : calendarTemplateUrl(eventNow)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {isEmail ? "Open in Gmail" : "Open in Google Calendar"}
            <ArrowIcon size={18} weight={2.5} className="button-arrow" />
          </a>
          <button type="button" className={styles.quiet} onClick={() => void decide("dismiss")} disabled={busy !== null}>
            Dismiss
          </button>
          <span className={styles.small}>
            Nexus can’t act in your apps on this deployment yet, so this opens it ready to go.
          </span>
        </div>
      ) : !connected ? (
        <div className={styles.actions}>
          <button type="button" className="button" onClick={() => void connect()} disabled={busy !== null}>
            {busy === "connect" ? `Waiting for ${TOOLKIT_LABEL[toolkit]}…` : `Connect ${TOOLKIT_LABEL[toolkit]}`}
          </button>
          <button type="button" className={styles.quiet} onClick={() => void decide("dismiss")} disabled={busy !== null}>
            Dismiss
          </button>
          <span className={styles.small}>
            One-time sign-in through Composio, so Nexus can do what you approve, and nothing else.
          </span>
        </div>
      ) : (
        <>
          <p className={styles.small}>
            {isEmail
              ? "Nexus will send this exact email from your Gmail."
              : `Nexus will add this event to your Google Calendar${eventNow.attendees.length ? " and invite the guests" : ""}.`}
          </p>
          <div className={styles.actions}>
            <button type="button" className="button" onClick={() => void decide("approve")} disabled={busy !== null}>
              {busy === action.kind
                ? isEmail
                  ? "Sending…"
                  : "Adding…"
                : isEmail
                  ? "Approve and send"
                  : "Approve and add"}
            </button>
            {isEmail ? (
              <button
                type="button"
                className={styles.quiet}
                onClick={() => void decide("approve", "create_draft")}
                disabled={busy !== null}
              >
                {busy === "create_draft" ? "Saving…" : "Save as draft instead"}
              </button>
            ) : null}
            <button type="button" className={styles.quiet} onClick={() => void decide("dismiss")} disabled={busy !== null}>
              Dismiss
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** The action log: what Nexus did, or tried to do, in the user's apps. */
export function ActionLog({ version }: { version: number }) {
  const [items, setItems] = useState<ActionRecord[] | null>(null);
  useEffect(() => {
    let live = true;
    void api<{ actions: ActionRecord[] }>("/api/actions").then((r) => {
      if (live) setItems(r.ok ? r.data.actions : []);
    });
    return () => {
      live = false;
    };
  }, [version]);

  if (!items?.length) return null;
  const label: Record<string, string> = { done: "Done", failed: "Failed", dismissed: "Dismissed", approved: "In progress" };
  return (
    <section className={styles.history} aria-labelledby="log-title">
      <h2 id="log-title" className={styles.sideHead}>
        Done by Nexus
      </h2>
      <ul className={styles.logList}>
        {items.map((a) => (
          <li key={a.id} className={styles.logItem}>
            <span className={styles.statusChip} data-status={a.status}>
              {label[a.status] ?? a.status}
            </span>
            <span className={styles.logTitle}>{a.title}</span>
            <span className={styles.logMeta}>
              {TOOLKIT_LABEL[TOOLKIT_OF[a.kind]]} ·{" "}
              {new Date(a.executed_at ?? a.created_at).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {a.result?.link ? (
                <>
                  {" · "}
                  <a href={a.result.link} target="_blank" rel="noopener noreferrer">
                    Open ↗
                  </a>
                </>
              ) : null}
            </span>
            {a.status === "failed" && a.error ? <span className={styles.logError}>{a.error}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
