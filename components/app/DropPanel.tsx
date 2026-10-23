"use client";

import { useEffect, useRef, useState, type DragEvent, type FormEvent, type KeyboardEvent } from "react";
import { ArrowIcon, LinkIcon, MicIcon, NoteIcon, PaperclipIcon, PdfLogo, ReelIcon } from "@/components/icons";
import { detectType, parseLink } from "@/lib/ingest/detect";
import { SOURCE_LABEL, type CaptureSummary, type Connection } from "@/lib/vault";
import styles from "./app.module.css";
import {
  ACCEPT,
  canTake,
  draggedText,
  formatBytes,
  formatDuration,
  MAX_FILE_CHARS,
  readFile,
  uploadWithProgress,
  type Attached,
} from "./files";
import { api, Stages, useSlow, useStage } from "./shared";
import { formatDate, SourceIcon } from "./SourceIcon";

const MAX = 10_000;
const STEPS = ["Reading", "Understanding", "Connecting"];
const MEDIA_STEPS = ["Uploading", "Transcribing", "Understanding", "Connecting"];

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
  const [file, setFile] = useState<Attached | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [fileNote, setFileNote] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploaded, setUploaded] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const link = file ? null : parseLink(input);
  const kind = file ? SOURCE_LABEL[file.kind] : link ? SOURCE_LABEL[detectType(link)] : input.trim() ? "Note" : null;
  const working = state.kind === "working";
  const isMedia = Boolean(file?.media);
  const ready = Boolean(input.trim() || file) && !reading;
  const stage = useStage(working && !isMedia, link || file ? [0, 3500, 8000] : [0, 1200, 4000]);
  // Media: uploading until the file is stored, then transcribing, understanding and connecting on a schedule.
  const mediaStage = useStage(working && isMedia && uploaded, [0, 15_000, 25_000]);
  const steps = isMedia ? MEDIA_STEPS.map((s, i) => (i === 0 && !uploaded ? `${s} ${uploadPct}%` : s)) : STEPS;
  const activeStep = isMedia ? (uploaded ? 1 + mediaStage : 0) : stage;
  const slow = useSlow(working, isMedia ? 45_000 : 25_000);

  // A file dropped beside the box would make the browser open it and leave the app; keep it here instead.
  useEffect(() => {
    const guard = (event: globalThis.DragEvent) => {
      if (Array.from(event.dataTransfer?.types ?? []).includes("Files")) event.preventDefault();
    };
    window.addEventListener("dragover", guard);
    window.addEventListener("drop", guard);
    return () => {
      window.removeEventListener("dragover", guard);
      window.removeEventListener("drop", guard);
    };
  }, []);

  async function attach(chosen: File, others = 0) {
    setReading(chosen.name);
    setFileNote(null);
    const result = await readFile(chosen);
    setReading(null);
    if (result.ok) {
      setFile(result.file);
      setState({ kind: "idle" });
      if (others) setFileNote(`Nexus takes one file at a time, so it added ${chosen.name}.`);
      else if (result.file.chars > MAX_FILE_CHARS) {
        setFileNote(`That’s a long one: Nexus keeps the first ${MAX_FILE_CHARS.toLocaleString("en-IN")} characters.`);
      }
      field.current?.focus();
    } else setFileNote(result.message);
  }

  function onDragEnter(event: DragEvent) {
    if (working || !canTake(event.dataTransfer)) return;
    event.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  }

  function onDragOver(event: DragEvent) {
    if (working || !canTake(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function onDragLeave() {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (working) return;
    const files = Array.from(event.dataTransfer.files);
    if (files.length) {
      void attach(files[0], files.length - 1);
      return;
    }
    const text = draggedText(event.dataTransfer);
    if (text) {
      setInput((current) => (current.trim() ? `${current.trimEnd()}\n${text}` : text).slice(0, MAX));
      setState({ kind: "idle" });
      field.current?.focus();
    }
  }

  async function send(options: { force?: boolean; pasted?: string } = {}) {
    if (!ready || working) return;
    abort.current = new AbortController();
    const signal = abort.current.signal;
    setState({ kind: "working" });

    // Video and audio go straight to the user's private storage first, then the server transcribes them.
    let media: { path: string; name: string; mime: string } | undefined;
    if (file?.media) {
      setUploadPct(0);
      setUploaded(false);
      const prep = await api<{ path: string; url: string }>("/api/uploads", {
        method: "POST",
        body: JSON.stringify({ name: file.name, type: file.mime, size: file.bytes }),
        signal,
      });
      if (!prep.ok) {
        setState(prep.error.code === "cancelled" ? { kind: "idle" } : { kind: "error", message: prep.error.message });
        return;
      }
      const stored = await uploadWithProgress(prep.data.url, file.media, file.mime, setUploadPct, signal);
      if (!stored) {
        setState(
          signal.aborted
            ? { kind: "idle" }
            : { kind: "error", message: "The upload didn’t finish. Check your connection and try again." },
        );
        return;
      }
      setUploaded(true);
      media = { path: prep.data.path, name: file.name, mime: file.mime };
    }

    const document = file && !file.media ? { name: file.name, kind: file.kind, text: file.text } : undefined;
    const result = await api<Saved>("/api/capture", {
      method: "POST",
      body: JSON.stringify({ input, document, media, ...options }),
      signal,
    });
    if (result.ok) {
      setState({ kind: "done", ...result.data });
      onSaved(result.data.capture);
      setInput("");
      setPasted("");
      setFile(null);
      setFileNote(null);
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
          A note, a YouTube video or reel, an article, a post on X, a PDF, a video or voice recording. Nexus reads it,
          pulls out what matters and stitches it to what you dropped before.
        </p>

        <form
          className={styles.composer}
          onSubmit={onSubmit}
          data-tone="drop"
          data-dragging={dragging || undefined}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {dragging ? (
            <div className={styles.dropOverlay} aria-hidden="true">
              <span className={styles.dropOverlayIcons}>
                <PdfLogo size={30} />
                <ReelIcon size={26} />
                <MicIcon size={26} />
                <LinkIcon size={26} />
              </span>
              <strong>Drop it here</strong>
              <span>A PDF, a video, a voice note, a text file, or a link from another tab</span>
            </div>
          ) : null}
          <label htmlFor="drop-input" className="sr-only">
            {file ? "A note about this file (optional)" : "What did you just learn?"}
          </label>
          {file || reading ? (
            <div className={styles.fileChip} data-kind={file?.kind ?? "pdf"}>
              {file?.kind === "text" ? (
                <NoteIcon size={22} />
              ) : file?.kind === "video" ? (
                <ReelIcon size={24} />
              ) : file?.kind === "audio" ? (
                <MicIcon size={24} />
              ) : (
                <PdfLogo size={26} />
              )}
              <span className={styles.fileText}>
                <span className={styles.fileName}>{file?.name ?? reading}</span>
                <span className={styles.fileMeta}>
                  {file?.media
                    ? [
                        file.kind === "video" ? "Video" : "Audio",
                        file.duration ? formatDuration(file.duration) : null,
                        formatBytes(file.bytes),
                        "transcribed when you drop it",
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : file
                      ? [
                          file.pages ? `${file.pages} ${file.pages === 1 ? "page" : "pages"}` : null,
                          `${Math.min(file.chars, MAX_FILE_CHARS).toLocaleString("en-IN")} characters`,
                        ]
                          .filter(Boolean)
                          .join(" · ")
                      : "Reading the file…"}
                </span>
              </span>
              {file ? (
                <button
                  type="button"
                  className={styles.fileRemove}
                  onClick={() => {
                    setFile(null);
                    setFileNote(null);
                  }}
                  aria-label={`Remove ${file.name}`}
                  disabled={working}
                >
                  ×
                </button>
              ) : null}
            </div>
          ) : null}
          <textarea
            id="drop-input"
            ref={field}
            className={styles.field}
            data-compact={file || reading ? "" : undefined}
            value={input}
            maxLength={MAX}
            rows={file || reading ? 2 : 3}
            placeholder={
              file || reading
                ? "Add a note about this file (optional)…"
                : "Paste a link, type a note, drop anything you just learned…"
            }
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
            <span className={styles.footStart}>
              <button
                type="button"
                className={styles.attach}
                onClick={() => picker.current?.click()}
                disabled={working || Boolean(reading)}
              >
                <PaperclipIcon size={18} />
                Attach a file
              </button>
              <input
                ref={picker}
                type="file"
                accept={ACCEPT}
                hidden
                onChange={(e) => {
                  const chosen = e.target.files?.[0];
                  if (chosen) void attach(chosen);
                  e.target.value = "";
                }}
              />
              <span className={styles.detected} aria-live="polite">
                {kind ? (
                  <>
                    {link ? <LinkIcon size={14} /> : null}
                    {kind}
                    {!link && !file ? (
                      <span className={styles.count}>{input.length.toLocaleString("en-IN")} / 10,000</span>
                    ) : null}
                  </>
                ) : (
                  <span className={styles.hintKeys}>or drag a PDF, a video or a link here</span>
                )}
              </span>
            </span>
            <button type="submit" className="button" disabled={!ready || working}>
              {working ? "Absorbing…" : "Drop it"}
              <ArrowIcon size={18} weight={2.5} className="button-arrow" />
            </button>
          </div>
          {fileNote ? (
            <p className={styles.fileNote} role="status">
              {fileNote}
            </p>
          ) : null}
        </form>

        <div className={styles.outcome} aria-live="polite">
          {working ? (
            <div className={styles.processing}>
              <Stages steps={steps} active={activeStep} label="Absorbing your drop" />
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
                    <strong>{state.title}</strong>
                    {/[.!?…]$/.test(state.title) ? " " : ". "}
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
