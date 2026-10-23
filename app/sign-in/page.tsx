import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getSession, googleEnabled, supabaseConfigured } from "@/lib/supabase/server";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

const ERRORS: Record<string, { title: string; text: string }> = {
  "google-not-configured": {
    title: "Google sign-in isn’t switched on yet",
    text: "This deployment of Nexus is connected to its database, but the Google provider hasn’t been enabled in Supabase Auth yet. Once it is, this button signs you straight in.",
  },
  "not-configured": {
    title: "Sign-in isn’t connected on this deployment",
    text: "This copy of Nexus has no Supabase project configured, so it can’t create accounts. The demo on the home page still works.",
  },
  "oauth-start": {
    title: "Google sign-in didn’t start",
    text: "Something went wrong opening Google. Try again in a moment.",
  },
  callback: {
    title: "That sign-in didn’t finish",
    text: "Google sent you back without a valid session, perhaps because the link was opened twice or expired. Try again.",
  },
  session: {
    title: "Your session ended",
    text: "Sign in again to get back to your Vault. Nothing you dropped is lost.",
  },
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getSession()) redirect("/dashboard");
  const { error } = await searchParams;
  const ready = supabaseConfigured() && (await googleEnabled());
  const problem = error ? ERRORS[error] : !ready ? ERRORS[supabaseConfigured() ? "google-not-configured" : "not-configured"] : null;

  return (
    <>
      <SiteHeader links={false} />
      <main id="main" className={styles.main}>
        <h1 className={styles.title}>{problem ? problem.title : "Sign in to your Vault"}</h1>
        <p className={styles.text}>
          {problem
            ? problem.text
            : "One click with Google. Your Vault is private to you, and Nexus doesn’t train AI on your data."}
        </p>
        <div className={styles.actions}>
          {ready ? (
            <a className="button" href="/auth/sign-in">
              <GoogleG /> Continue with Google
            </a>
          ) : null}
          <Link className={ready ? styles.secondary : "button"} href="/#demo">
            Back to the demo
          </Link>
        </div>
      </main>
    </>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={styles.google}>
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.29 14.29A7.2 7.2 0 0 1 4.91 12c0-.8.14-1.57.38-2.29v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39z" />
      <path fill="#EA4335" d="M12 4.76c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.28 6.61l4.01 3.1C6.23 6.87 8.88 4.76 12 4.76z" />
    </svg>
  );
}
