import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

/**
 * Placeholder for the Google sign-in flow (Supabase Auth in the product spec), which does not exist in this
 * repository yet. It says so plainly instead of pretending to sign anyone in. Replace this route, or point
 * NEXT_PUBLIC_SIGN_IN_URL at the real one (see lib/site.ts).
 */
export default function SignInPage() {
  return (
    <>
      <SiteHeader links={false} />
      <main id="main" className={styles.main}>
        <h1 className={styles.title}>Sign-in isn’t connected yet</h1>
        <p className={styles.text}>
          This preview of <span translate="no">Nexus</span> runs the interactive demo only. Nothing here creates an
          account or signs you in.
        </p>
        <Link className="button" href="/#demo">
          Back to the demo
        </Link>
      </main>
    </>
  );
}
