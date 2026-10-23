import type { Metadata } from "next";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/server";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Live stats",
  description: "How many people have signed up to Nexus, and how much they have dropped and handed off.",
};

// Counted on every request, so the numbers are live.
export const dynamic = "force-dynamic";

type Stats = { users: number; captures: number; asks: number };

async function loadStats(): Promise<Stats | null> {
  if (!supabaseConfigured()) return null;
  // Anonymous client: nexus_stats() returns three totals and nothing else, no ids and no content.
  const supabase = createSupabase(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("nexus_stats");
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) return null;
  return { users: Number(row.users), captures: Number(row.captures), asks: Number(row.asks) };
}

export default async function StatsPage() {
  const stats = await loadStats();
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
        {figures ? (
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
