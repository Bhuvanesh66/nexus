"use client";

import { useDeferredValue, useState } from "react";
import type { CaptureSummary } from "@/lib/vault";
import styles from "./app.module.css";
import { formatDate, SourceIcon } from "./SourceIcon";

export function VaultPanel({
  captures,
  loadError,
  onOpen,
  onDrop,
  onRetry,
}: {
  captures: CaptureSummary[] | null;
  loadError: string | null;
  onOpen: (id: string, options?: { confirmDelete?: boolean }) => void;
  onDrop: () => void;
  onRetry: () => void;
}) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const terms = deferred.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = (captures ?? []).filter((c) => {
    if (!terms.length) return true;
    const haystack = `${c.title} ${c.summary} ${c.one_line_takeaway} ${c.keywords.join(" ")}`.toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });

  return (
    <section className={styles.primaryWide} aria-labelledby="vault-title">
      <div className={styles.vaultHead}>
        <h1 id="vault-title" className={styles.head}>
          Your <span data-tone="vault">Vault.</span>
        </h1>
        <p className={styles.vaultCount}>
          {captures === null ? "Loading…" : `${captures.length} ${captures.length === 1 ? "fragment" : "fragments"}`}
        </p>
      </div>

      <div className={styles.search}>
        <label htmlFor="vault-search" className="sr-only">
          Search your Vault
        </label>
        <input
          id="vault-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search titles, summaries and keywords"
          autoComplete="off"
        />
      </div>

      {loadError ? (
        <div className={styles.notice} data-tone="error" role="alert">
          <p>{loadError}</p>
          <div className={styles.actions}>
            <button type="button" className="button" onClick={onRetry}>
              Try again
            </button>
          </div>
        </div>
      ) : captures === null ? (
        <div className={styles.skeletonList} aria-label="Loading your Vault">
          <span />
          <span />
          <span />
          <span />
        </div>
      ) : captures.length === 0 ? (
        <div className={styles.emptyVault}>
          <p>Nothing in your Vault yet. Drop the first thing you learned today and Nexus starts connecting.</p>
          <button type="button" className="button" onClick={onDrop}>
            Drop your first fragment
          </button>
        </div>
      ) : shown.length === 0 ? (
        <p className={styles.empty} role="status">
          Nothing matches “{deferred}”.
        </p>
      ) : (
        <ul className={styles.rows} aria-label="Fragments, newest first">
          {shown.map((c) => (
            <li key={c.id} className={styles.row}>
              <button type="button" className={styles.rowMain} onClick={() => onOpen(c.id)}>
                <SourceIcon type={c.type} />
                <span className={styles.rowText}>
                  <span className={styles.rowTitle}>{c.title}</span>
                  <span className={styles.rowTakeaway}>{c.one_line_takeaway}</span>
                  {c.keywords.length ? (
                    <span className={styles.tags}>
                      {c.keywords.slice(0, 5).map((k) => (
                        <span key={k} className={styles.tag}>
                          {k}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </span>
                <span className={styles.rowMeta}>
                  <time dateTime={c.created_at}>{formatDate(c.created_at)}</time>
                  {c.connection_count ? <span>🔗 {c.connection_count}</span> : null}
                </span>
              </button>
              <button
                type="button"
                className={styles.rowMenu}
                popoverTarget={`menu-${c.id}`}
                aria-label={`More for ${c.title}`}
              >
                <span aria-hidden="true">⋯</span>
              </button>
              <div id={`menu-${c.id}`} popover="auto" className={styles.menu}>
                <button type="button" onClick={() => onOpen(c.id)} popoverTarget={`menu-${c.id}`} popoverTargetAction="hide">
                  View details
                </button>
                <button
                  type="button"
                  data-tone="danger"
                  popoverTarget={`menu-${c.id}`}
                  popoverTargetAction="hide"
                  onClick={() => onOpen(c.id, { confirmDelete: true })}
                >
                  Delete…
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
