"use client";

import { useEffect, useRef, useState } from "react";
import { SOURCE_LABEL, type CaptureDetail as Detail } from "@/lib/vault";
import styles from "./app.module.css";
import { api } from "./shared";
import { formatDate, SourceIcon } from "./SourceIcon";

type Props = {
  id: string | null;
  confirmDelete: boolean;
  onClose: () => void;
  onOpen: (id: string) => void;
  onDeleted: (id: string) => void;
};

/** The fragment's full record in a modal dialog: summary, source, keywords, names, connections, delete. */
export function CaptureDetail({ id, confirmDelete, onClose, onOpen, onDeleted }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (id && !el.open) el.showModal();
    if (!id && el.open) el.close();
  }, [id]);

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="detail-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.dialogBody}>
        <button type="button" className={styles.dialogClose} onClick={onClose} aria-label="Close">
          ×
        </button>
        {id ? (
          <DetailContent key={id} id={id} confirmDelete={confirmDelete} onOpen={onOpen} onDeleted={onDeleted} />
        ) : null}
      </div>
    </dialog>
  );
}

/** Keyed by the fragment id, so its state (loaded record, delete confirmation) starts fresh for each one. */
function DetailContent({ id, confirmDelete, onOpen, onDeleted }: Omit<Props, "id" | "onClose"> & { id: string }) {
  const [current, setCurrent] = useState<{ data: Detail | null; error: string | null } | null>(null);
  const [askingDelete, setAskingDelete] = useState(confirmDelete);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void api<{ capture: Detail }>(`/api/captures/${id}`).then((result) => {
      if (live) setCurrent(result.ok ? { data: result.data.capture, error: null } : { data: null, error: result.error.message });
    });
    return () => {
      live = false;
    };
  }, [id]);

  async function remove() {
    setDeleting(true);
    setDeleteError(null);
    const result = await api<null>(`/api/captures/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (result.ok || result.status === 404) onDeleted(id);
    else setDeleteError(result.error.message);
  }

  return (
    <>
        {!current ? (
          <div className={styles.skeleton} aria-label="Loading the fragment">
            <span />
            <span />
            <span />
          </div>
        ) : current.error || !current.data ? (
          <p role="alert">{current.error ?? "That fragment didn’t load."}</p>
        ) : (
          <>
            <p className={styles.savedLabel}>
              <SourceIcon type={current.data.type} size={16} />
              {SOURCE_LABEL[current.data.type]} · saved {formatDate(current.data.created_at)}
              {current.data.summary_source === "basic" ? <span className={styles.badge}>Basic summary</span> : null}
            </p>
            <h2 id="detail-title" className={styles.detailTitle}>
              {current.data.title}
            </h2>
            <p className={styles.takeaway}>{current.data.one_line_takeaway}</p>

            <h3 className={styles.detailHead}>Summary</h3>
            <p className={styles.detailSummary}>{current.data.summary}</p>

            {current.data.source_url ? (
              <p>
                <a href={current.data.source_url} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                  Open the original source ↗
                </a>
              </p>
            ) : null}

            {current.data.keywords.length ? (
              <>
                <h3 className={styles.detailHead}>Keywords</h3>
                <p className={styles.tags}>
                  {current.data.keywords.map((k) => (
                    <span key={k} className={styles.tag}>
                      {k}
                    </span>
                  ))}
                </p>
              </>
            ) : null}

            {current.data.entities.length ? (
              <>
                <h3 className={styles.detailHead}>People, companies and tools</h3>
                <p className={styles.tags}>
                  {current.data.entities.map((k) => (
                    <span key={k} className={styles.tag} data-kind="entity">
                      {k}
                    </span>
                  ))}
                </p>
              </>
            ) : null}

            <h3 className={styles.detailHead}>Connected fragments</h3>
            {current.data.connections.length ? (
              <ul className={styles.connections}>
                {current.data.connections.map((c) => (
                  <li key={c.id}>
                    <button type="button" className={styles.connection} onClick={() => onOpen(c.id)}>
                      <SourceIcon type={c.type} size={16} />
                      <span>
                        <span className={styles.recentTitle}>{c.title}</span>
                        {c.reason ? <span className={styles.recentMeta}>{c.reason}</span> : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.muted}>No connections yet. Drop more on this topic and Nexus will link them.</p>
            )}

            <div className={styles.dangerZone}>
              {askingDelete ? (
                <div role="alert">
                  <p>Delete this fragment? Nexus won’t use it in any future hand-off, and its connections go too.</p>
                  {deleteError ? <p className={styles.errorText}>{deleteError}</p> : null}
                  <div className={styles.actions}>
                    <button type="button" className={styles.danger} onClick={() => void remove()} disabled={deleting}>
                      {deleting ? "Deleting…" : "Delete fragment"}
                    </button>
                    <button type="button" className={styles.quiet} onClick={() => setAskingDelete(false)}>
                      Keep it
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className={styles.quietDanger} onClick={() => setAskingDelete(true)}>
                  Delete…
                </button>
              )}
            </div>
          </>
        )}
    </>
  );
}
