"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowIcon, LinkIcon } from "@/components/icons";
import { detectType, parseLink } from "@/lib/ingest/detect";
import { SOURCE_LABEL, type CaptureSummary, type Connection } from "@/lib/vault";
import styles from "./app.module.css";
import { api, Stages, useSlow, useStage } from "./shared";
import { formatDate, SourceIcon } from "./SourceIcon";

const MAX = 10_000;
const STEPS = ["Reading", "Understanding", "Connecting"];

type Saved = { capture: CaptureSummary; connections: Connection[]; notices: string[] };
type State =
  | { kind: "idle" }
  | { kind: "working" }
  | ({ kind: "done" } & Saved)
  | { kind: "duplicate"; savedAt: string; title: string; id: string }
  | { kind: "recover"; code: string; message: string; title: string | null }
  | { kind: "error"; message: string };

export function DropPanel({
  recent,
  onSaved,
  onOpen,
}: {
  recent: CaptureSummary[] | null;
  onSaved: (capture: CaptureSummary) => void;
  onOpen: (id: string) => void;
}) {
  const [input, setInput] = useState("");
  const [pasted, setPasted] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const abort = useRef<AbortController | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  const link = parseLink(input);
  const kind = link ? SOURCE_LABEL[detectType(link)] : input.trim() ? "Note" : null;
  const working = state.kind === "working";
  const stage = useStage(working, link ? [0, 3500, 8000] : [0, 1200, 4000]);
  const slow = useSlow(working, 25_000);

  async function send(options: { force?: boolean; pasted?: string } = {}) {
    if (!input.trim() || working) return;
    abort.current = new AbortController();
    setState({ kind: "working" });
    const result = await api<Saved>("/api/capture", {
      method: "POST",
      body: JSON.stringify({ input, ...options }),
      signal: abort.current.signal,
    });
    if (result.ok) {
      setState({ kind: "done", ...result.data });
      onSaved(result.data.capture);
      setInput("");
      setPasted("");
      if (field.current) field.current.style.height = "";
      return;
    }
    const { error } = result;
    if (error.code === "cancelled") setState({ kind: "idle" });
    else if (error.code === "duplicate") {
      setState({
        kind: "duplicate",
        savedAt: String(error.savedAt),
        title: String(error.title),
        id: String(error.id),
      });
    } else if (error.code === "no-transcript" || error.code === "blocked") {
      setState({ kind: "recover", code: error.code, message: error.message, title: (error.title as string) ?? null });
    } else setState({ kind: "error", message: error.message });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void send();
    }
  }

  return (
    <div className={styles.cols}>
      <section className={styles.primary} aria-labelledby="drop-title">
        <h1 id="drop-title" className={styles.head}>
          Drop what you <span data-tone="drop">just learned.</span>
        </h1>
        <p className={styles.lead}>
          A note, a YouTube video, an article, a post on X. Nexus reads it, pulls out what matters and stitches it
          to what you dropped before.
        </p>

        <form className={styles.composer} onSubmit={onSubmit} data-tone="drop">
          <label htmlFor="drop-input" className="sr-only">
            What did you just learn?
          </label>
          <textarea
            id="drop-input"
            ref={field}
            className={styles.field}
            value={input}
            maxLength={MAX}
            rows={3}
            placeholder="Paste a link, type a note, drop anything you just learned…"
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 420)}px`;
              if (state.kind !== "working" && state.kind !== "idle" && state.kind !== "done") setState({ kind: "idle" });
            }}
            onKeyDown={onKeyDown}
            disabled={working}
          />
          <div className={styles.composerFoot}>
            <span className={styles.detected} aria-live="polite">
              {kind ? (
                <>
                  {link ? <LinkIcon size={14} /> : null}
                  {kind}
                  {!link ? <span className={styles.count}>{input.length.toLocaleString("en-IN")} / 10,000</span> : null}
                </>
              ) : (
                <span className={styles.hintKeys}>Ctrl + Enter to drop</span>
              )}
            </span>
            <button type="submit" className="button" disabled={!input.trim() || working}>
              {working ? "Absorbing…" : "Drop it"}
              <ArrowIcon size={18} weight={2.5} className="button-arrow" />
            </button>
          </div>
        </form>

        <div className={styles.outcome} aria-live="polite">
          {working ? (
            <div className={styles.processing}>
              <Stages steps={STEPS} active={stage} label="Absorbing your drop" />
              <div className={styles.skeleton} aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              {slow ? (
                <p className={styles.slow}>
                  Still working. Long videos and articles take a little longer.{" "}
                  <button type="button" className={styles.textButton} onClick={() => abort.current?.abort()}>
                    Cancel
                  </button>
                </p>
              ) : null}
            </div>
          ) : null}

          {state.kind === "done" ? <SavedCard saved={state} onOpen={onOpen} /> : null}

          {state.kind === "duplicate" ? (
            <div className={styles.notice} role="alert">
              <p>
                You already saved this on {formatDate(state.savedAt)}: <strong>{state.title}</strong>. Save again
                anyway?
              </p>
              <div className={styles.actions}>
                <button type="button" className="button" onClick={() => void send({ force: true })}>
                  Save again
                </button>
                <button type="button" className={styles.quiet} onClick={() => onOpen(state.id)}>
                  View the saved one
                </button>
                <button type="button" className={styles.quiet} onClick={() => setState({ kind: "idle" })}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {state.kind === "recover" ? (
            <div className={styles.notice} role="alert">
              <p>
                {state.title ? (
                  <>
                    <strong>{state.title}</strong>.{" "}
                  </>
                ) : null}
                {state.message}
              </p>
              <label htmlFor="drop-pasted" className={styles.smallLabel}>
                {state.code === "no-transcript" ? "Your summary of the video" : "The text you want to save"}
              </label>
              <textarea
                id="drop-pasted"
                className={styles.pasteField}
                value={pasted}
                maxLength={MAX}
                rows={5}
                onChange={(e) => setPasted(e.target.value)}
              />
              <div className={styles.actions}>
                <button
                  type="button"
                  className="button"
                  disabled={!pasted.trim()}
                  onClick={() => void send({ pasted, force: true })}
                >
                  Save with my text
                </button>
                <button type="button" className={styles.quiet} onClick={() => setState({ kind: "idle" })}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {state.kind === "error" ? (
            <div className={styles.notice} data-tone="error" role="alert">
              <p>{state.message}</p>
              <div className={styles.actions}>
                <button type="button" className="button" onClick={() => void send()}>
                  Try again
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <aside className={styles.secondary} aria-labelledby="recent-title">
        <h2 id="recent-title" className={styles.sideHead}>
          Recent drops
        </h2>
        {recent === null ? (
          <div className={styles.skeletonList} aria-label="Loading your recent drops">
            <span />
            <span />
            <span />
          </div>
        ) : recent.length === 0 ? (
          <p className={styles.empty}>Nothing yet. Your first drop starts your Vault.</p>
        ) : (
          <ul className={styles.recent}>
            {recent.slice(0, 5).map((c) => (
              <li key={c.id}>
                <button type="button" className={styles.recentItem} onClick={() => onOpen(c.id)}>
                  <SourceIcon type={c.type} size={16} />
                  <span>
                    <span className={styles.recentTitle}>{c.title}</span>
                    <span className={styles.recentMeta}>
                      {formatDate(c.created_at)}
                      {c.connection_count ? ` · ${c.connection_count} connected` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function SavedCard({ saved, onOpen }: { saved: Saved; onOpen: (id: string) => void }) {
  const { capture, connections, notices } = saved;
  return (
    <article className={styles.savedCard}>
      <p className={styles.savedLabel}>
        <SourceIcon type={capture.type} size={16} />
        Absorbed · {SOURCE_LABEL[capture.type]}
        {capture.summary_source === "basic" ? <span className={styles.badge}>Basic summary</span> : null}
      </p>
      <h2 className={styles.savedTitle}>
        <button type="button" className={styles.linkButton} onClick={() => onOpen(capture.id)}>
          {capture.title}
        </button>
      </h2>
      <p className={styles.takeaway}>{capture.one_line_takeaway}</p>
      {connections.length ? (
        <div className={styles.connected}>
          <p className={styles.connectedHead}>
            Connected to {connections.length === 1 ? "1 thing" : `${connections.length} things`} you already told me:
          </p>
          <ul className={styles.pills}>
            {connections.slice(0, 3).map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={styles.pill}
                  onClick={() => onOpen(c.id)}
                  title={c.reason ?? undefined}
                >
                  <span aria-hidden="true">🔗</span> Related to ‘{c.title}’
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className={styles.muted}>No connections yet. This is the first fragment on this topic in your Vault.</p>
      )}
      {notices.map((n) => (
        <p key={n} className={styles.small}>
          {n}
        </p>
      ))}
    </article>
  );
}
