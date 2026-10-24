"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowIcon } from "@/components/icons";
import { DEFAULT_MODE, MODES, type Mode } from "@/lib/prompts";
import { EMPTY_VAULT_LINE, type AskRecord, type AskSource } from "@/lib/vault";
import { ActionCards, ActionLog } from "./ActionCards";
import styles from "./app.module.css";
import { gmailUrl, Markdown, plainText } from "./Markdown";
import { api, Stages, useSlow, useStage } from "./shared";
import { formatDate, SourceIcon } from "./SourceIcon";

const STEPS = ["Checking what you’ve taught me", "Combining with general knowledge", "Writing it up"];

type Failure = { message: string; code: string; sources?: AskSource[] };

export function AskPanel({ onOpen, vaultSize }: { onOpen: (id: string) => void; vaultSize: number | null }) {
  const [task, setTask] = useState("");
  const [mode, setMode] = useState<Mode>(DEFAULT_MODE);
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState<AskRecord | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [history, setHistory] = useState<AskRecord[] | null>(null);
  const [logVersion, setLogVersion] = useState(0);
  const bumpLog = () => setLogVersion((v) => v + 1);
  const abort = useRef<AbortController | null>(null);
  const stage = useStage(running, [0, 2500, 6000]);
  const slow = useSlow(running, 15_000);

  useEffect(() => {
    let live = true;
    void api<{ asks: AskRecord[] }>("/api/ask").then((result) => {
      if (live) setHistory(result.ok ? result.data.asks : []);
    });
    return () => {
      live = false;
    };
  }, []);

  async function ask() {
    if (!task.trim() || running) return;
    abort.current = new AbortController();
    setRunning(true);
    setFailure(null);
    const result = await api<{ ask: AskRecord }>("/api/ask", {
      method: "POST",
      body: JSON.stringify({ task, mode }),
      signal: abort.current.signal,
    });
    setRunning(false);
    if (result.ok) {
      setCurrent(result.data.ask);
      setHistory((h) => [result.data.ask, ...(h ?? [])]);
    } else if (result.error.code !== "cancelled") {
      setFailure({
        message: result.error.message,
        code: result.error.code,
        sources: result.error.sources as AskSource[] | undefined,
      });
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void ask();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void ask();
    }
  }

  const earlier = (history ?? []).filter((a) => a.id !== current?.id);

  return (
    <div className={styles.stack}>
      <section className={styles.primary} aria-labelledby="ask-title">
        <h1 id="ask-title" className={styles.head}>
          What do you <span data-tone="ask">need done?</span>
        </h1>
        <p className={styles.lead}>
          Name the task. Nexus pulls the fragments that matter from your Vault
          {vaultSize ? ` (${vaultSize} so far)` : ""}, adds what it knows in general, and does the work.
        </p>

        <form className={styles.composer} onSubmit={onSubmit} data-tone="ask">
          <label htmlFor="ask-input" className="sr-only">
            The task
          </label>
          <textarea
            id="ask-input"
            className={styles.field}
            value={task}
            maxLength={2000}
            rows={3}
            placeholder="What do you want to do? e.g. “Help me prep for my meeting with Rajesh tomorrow”"
            onChange={(e) => {
              setTask(e.target.value);
              e.target.style.height = "";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 320)}px`;
            }}
            onKeyDown={onKeyDown}
            disabled={running}
          />
          <fieldset className={styles.modes} disabled={running}>
            <legend className="sr-only">Output mode</legend>
            {MODES.map((m) => (
              <label key={m} className={styles.mode}>
                <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} />
                <span>{m}</span>
              </label>
            ))}
          </fieldset>
          <div className={styles.composerFoot}>
            <span className={styles.hintKeys}>Ctrl + Enter to hand off</span>
            <button type="submit" className="button" disabled={!task.trim() || running}>
              {running ? "Working…" : "Hand it off"}
              <ArrowIcon size={18} weight={2.5} className="button-arrow" />
            </button>
          </div>
        </form>

        <div className={styles.outcome} aria-live="polite">
          {running ? (
            <div className={styles.processing}>
              <Stages steps={STEPS} active={stage} label="Working on your task" />
              <span className={styles.dots} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              {slow ? (
                <p className={styles.slow}>
                  Still thinking…{" "}
                  <button type="button" className={styles.textButton} onClick={() => abort.current?.abort()}>
                    Cancel
                  </button>
                </p>
              ) : null}
            </div>
          ) : null}

          {failure ? (
            <div className={styles.notice} data-tone="error" role="alert">
              <p>{failure.message}</p>
              {failure.sources?.length ? (
                <>
                  <p className={styles.small}>
                    These are the {failure.sources.length} fragments from your Vault it would have used:
                  </p>
                  <SourceList sources={failure.sources} onOpen={onOpen} idPrefix="failed" />
                </>
              ) : null}
              {failure.code !== "ai-not-configured" ? (
                <div className={styles.actions}>
                  <button type="button" className="button" onClick={() => void ask()}>
                    Retry
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {current && !running ? <ResponseCard ask={current} onOpen={onOpen} onActionsChanged={bumpLog} fresh /> : null}
        </div>
      </section>

      <section className={styles.history} aria-labelledby="history-title">
        <h2 id="history-title" className={styles.sideHead}>
          Earlier hand-offs
        </h2>
        {history === null ? (
          <div className={styles.skeletonList} aria-label="Loading earlier hand-offs">
            <span />
            <span />
          </div>
        ) : earlier.length === 0 ? (
          <p className={styles.empty}>Your hand-offs will be kept here, with the fragments each one used.</p>
        ) : (
          <ul className={styles.historyList}>
            {earlier.map((a) => (
              <li key={a.id}>
                <details className={styles.historyItem}>
                  <summary>
                    <span className={styles.historyTask}>{a.task}</span>
                    <span className={styles.historyMeta}>
                      {a.mode} · {formatDate(a.created_at)} ·{" "}
                      {a.sources.length ? `${a.sources.length} fragments used` : "general knowledge"}
                    </span>
                  </summary>
                  <ResponseCard ask={a} onOpen={onOpen} onActionsChanged={bumpLog} />
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ActionLog version={logVersion} />
    </div>
  );
}

function useCountUp(target: number, run: boolean) {
  const [value, setValue] = useState(run ? 0 : target);
  useEffect(() => {
    if (!run || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(frame);
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 700);
      setValue(Math.round(target * p));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, run]);
  return value;
}

function ResponseCard({
  ask,
  onOpen,
  onActionsChanged,
  fresh = false,
}: {
  ask: AskRecord;
  onOpen: (id: string) => void;
  onActionsChanged: () => void;
  fresh?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const used = useCountUp(ask.sources.length, fresh);
  const prefix = `src-${ask.id.slice(0, 8)}`;
  const isEmail = ask.mode === "Draft Email";

  async function copy() {
    try {
      await navigator.clipboard.writeText(plainText(ask.response));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className={styles.response} data-fresh={fresh || undefined}>
      <header className={styles.responseHead}>
        <span className={styles.modeChip}>{ask.mode}</span>
        {ask.sources.length ? (
          <span className={styles.usedCount}>
            <strong>{used}</strong> {ask.sources.length === 1 ? "fragment" : "fragments"} from your Vault used
          </span>
        ) : (
          <span className={styles.usedCount}>General knowledge</span>
        )}
      </header>
      {ask.general_only ? <p className={styles.emptyLine}>{EMPTY_VAULT_LINE}</p> : null}

      <Markdown
        text={ask.response}
        cite={(n) => {
          const source = ask.sources.find((s) => s.n === n);
          return source ? (
            <a className={styles.cite} href={`#${prefix}-${n}`} title={source.title}>
              {n}
            </a>
          ) : null;
        }}
      />

      <div className={styles.actions}>
        {isEmail ? (
          <a className="button" href={gmailUrl(ask.response)} target="_blank" rel="noopener noreferrer">
            Open in Gmail
            <ArrowIcon size={18} weight={2.5} className="button-arrow" />
          </a>
        ) : null}
        <button type="button" className={isEmail ? styles.quiet : "button"} onClick={() => void copy()}>
          {copied ? "Copied" : "Copy"}
        </button>
        {isEmail ? <span className={styles.small}>Opens a draft in Gmail. Nothing is sent until you press Send.</span> : null}
      </div>

      <ActionCards askId={ask.id} auto={fresh} onChanged={onActionsChanged} />

      {ask.sources.length ? (
        <details className={styles.sources}>
          <summary>
            Sources · {ask.sources.length} {ask.sources.length === 1 ? "fragment" : "fragments"} from your Vault
          </summary>
          <SourceList sources={ask.sources} onOpen={onOpen} idPrefix={prefix} />
        </details>
      ) : null}
    </article>
  );
}

function SourceList({
  sources,
  onOpen,
  idPrefix,
}: {
  sources: AskSource[];
  onOpen: (id: string) => void;
  idPrefix: string;
}) {
  return (
    <ol className={styles.sourceList}>
      {sources.map((s) => (
        <li key={s.id} id={`${idPrefix}-${s.n}`}>
          <span className={styles.sourceN}>{s.n}</span>
          <SourceIcon type={s.type} size={16} />
          <span className={styles.sourceTitle}>{s.title}</span>
          <span className={styles.sourceLinks}>
            {s.source_url ? (
              <a href={s.source_url} target="_blank" rel="noopener noreferrer">
                Open source ↗
              </a>
            ) : (
              <span className={styles.muted}>Typed note</span>
            )}
            <button type="button" className={styles.textButton} onClick={() => onOpen(s.id)}>
              View in Vault
            </button>
          </span>
        </li>
      ))}
    </ol>
  );
}
