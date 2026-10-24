import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { usePageMeta } from "@/lib/session";
import styles from "./stats.module.css";

type Stats = { users: number; captures: number; asks: number };

export default function StatsPage() {
  usePageMeta("Live stats", {
    description: "How many people have signed up to Nexus, and how much they have dropped and handed off.",
  });
  // undefined while loading, null when unavailable
  const [stats, setStats] = useState<Stats | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    fetch("/api/stats", { credentials: "include", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { stats: Stats | null } | null) => {
        const s = body?.stats;
        if (live) setStats(s ? { users: Number(s.users), captures: Number(s.captures), asks: Number(s.asks) } : null);
      })
      .catch(() => live && setStats(null));
    return () => {
      live = false;
    };
  }, []);

  const figures = stats
    ? [
        { value: stats.users, label: "people signed up", tone: "teal" },
        { value: stats.captures, label: "fragments dropped", tone: "sky" },
        { value: stats.asks, label: "tasks handed off and answered", tone: "violet" },
      ]
    : null;

  return (
    <>
      <SiteHeader links={false} />
      <main id="main" className={styles.main}>
        <h1 className={styles.title}>
          Nexus, <span>live.</span>
        </h1>
        {stats === undefined ? null : figures ? (
          <dl className={styles.figures}>
            {figures.map((f) => (
              <div key={f.label} className={styles.figure} data-tone={f.tone}>
                <dt>{f.label}</dt>
                <dd>{f.value.toLocaleString("en-IN")}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className={styles.note}>The live counts aren’t available right now. Try again in a moment.</p>
        )}
        <p className={styles.note}>Totals only, counted as this page loads. No names, no content.</p>
      </main>
    </>
  );
}
