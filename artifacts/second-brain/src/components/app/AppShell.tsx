
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { NexusMark, VaultMark } from "@/components/icons";
import type { CaptureSummary } from "@/lib/vault";
import { AskPanel } from "./AskPanel";
import { CaptureDetail } from "./CaptureDetail";
import { DropPanel } from "./DropPanel";
import { api } from "./shared";
import { VaultPanel } from "./VaultPanel";
import styles from "./app.module.css";

const TABS = [
  { id: "drop", label: "Drop" },
  { id: "ask", label: "Hand off" },
  { id: "vault", label: "Your Vault" },
] as const;
type Tab = (typeof TABS)[number]["id"];

// The open tab lives in the URL hash, so a refresh or the back button keeps it.
function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}
const readHash = () => window.location.hash.slice(1);

export type AppUser = { name: string; email: string; avatar: string | null };

export function AppShell({ user, aiReady }: { user: AppUser; aiReady: boolean }) {
  const hash = useSyncExternalStore(subscribe, readHash, () => "");
  const tab: Tab = TABS.some((t) => t.id === hash) ? (hash as Tab) : "drop";
  const [captures, setCaptures] = useState<CaptureSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState<{ id: string; confirmDelete: boolean } | null>(null);

  const go = useCallback((next: Tab) => {
    window.history.replaceState(null, "", `#${next}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    window.scrollTo({ top: 0 });
  }, []);

  const load = useCallback(async () => {
    const result = await api<{ captures: CaptureSummary[] }>("/api/captures");
    if (result.ok) {
      setCaptures(result.data.captures);
      setLoadError(null);
    } else setLoadError(result.error.message);
  }, []);

  useEffect(() => {
    let live = true;
    void api<{ captures: CaptureSummary[] }>("/api/captures").then((result) => {
      if (!live) return;
      if (result.ok) setCaptures(result.data.captures);
      else setLoadError(result.error.message);
    });
    return () => {
      live = false;
    };
  }, []);

  const openCapture = useCallback((id: string, options?: { confirmDelete?: boolean }) => {
    setOpen({ id, confirmDelete: Boolean(options?.confirmDelete) });
  }, []);

  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className={styles.bar}>
        <a href="/" className={styles.brand}>
          <NexusMark size={26} />
          <span translate="no">Nexus</span>
        </a>
        <nav className={styles.tabs} aria-label="Nexus">
          {TABS.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className={styles.tab}
              data-tone={t.id}
              aria-current={tab === t.id ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                go(t.id);
              }}
            >
              <TabIcon id={t.id} />
              <span>{t.label}</span>
            </a>
          ))}
        </nav>
        <AccountMenu user={user} />
      </header>

      {!aiReady ? (
        <p className={styles.banner} role="status">
          Nexus’s AI isn’t connected on this deployment yet. Drops are saved with a basic summary, and Hand off
          shows the fragments it would use but can’t write.
        </p>
      ) : null}

      <main id="main" className={styles.main}>
        <div hidden={tab !== "drop"}>
          <DropPanel
            recent={captures}
            onOpen={openCapture}
            onSaved={(capture) => setCaptures((list) => [capture, ...(list ?? [])])}
          />
        </div>
        <div hidden={tab !== "ask"}>
          <AskPanel onOpen={openCapture} vaultSize={captures?.length ?? null} />
        </div>
        <div hidden={tab !== "vault"}>
          <VaultPanel
            captures={captures}
            loadError={loadError}
            onOpen={openCapture}
            onDrop={() => go("drop")}
            onRetry={() => void load()}
          />
        </div>
      </main>

      <CaptureDetail
        id={open?.id ?? null}
        confirmDelete={open?.confirmDelete ?? false}
        onClose={() => setOpen(null)}
        onOpen={(id) => setOpen({ id, confirmDelete: false })}
        onDeleted={(id) => {
          setOpen(null);
          setCaptures((list) => (list ?? []).filter((c) => c.id !== id));
          void load();
        }}
      />
    </div>
  );
}

function TabIcon({ id }: { id: Tab }) {
  if (id === "vault") return <VaultMark size={18} />;
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      {id === "drop" ? (
        <path d="M10 3v9m0 0-3.5-3.5M10 12l3.5-3.5M4 13.5v2.75h12V13.5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M3.5 10h11m0 0-4-4m4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function AccountMenu({ user }: { user: AppUser }) {
  const initial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();
  return (
    <div className={styles.account}>
      <button type="button" className={styles.avatarButton} popoverTarget="account-menu" aria-label={`Account: ${user.name}`}>
        {user.avatar ? (
          // Google profile photos come from googleusercontent.com; a plain img avoids an image-optimiser allowlist.
          
          <img src={user.avatar} alt="" width={32} height={32} referrerPolicy="no-referrer" />
        ) : (
          <span aria-hidden="true">{initial}</span>
        )}
      </button>
      <div id="account-menu" popover="auto" className={styles.accountMenu}>
        <p className={styles.accountName}>{user.name}</p>
        {user.email && user.email !== user.name ? <p className={styles.accountEmail}>{user.email}</p> : null}
        <p className={styles.accountNote}>Your Vault is private. Nexus doesn’t train AI on your data.</p>
        <a href="/" className={styles.menuLink}>
          Nexus home
        </a>
        <a href="/stats" className={styles.menuLink}>
          Live stats
        </a>
        <form action="/auth/sign-out" method="post">
          <button type="submit" className={styles.menuLink}>
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
