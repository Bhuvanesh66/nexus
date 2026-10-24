import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { CloseWhenDone } from "./CloseWhenDone";
import styles from "../sign-in/page.module.css";

export const metadata: Metadata = { title: "Connected", robots: { index: false } };

const NAMES: Record<string, string> = { gmail: "Gmail", googlecalendar: "Google Calendar" };

/** Where Composio sends the user after they connect an app. Opened as a popup from the action card. */
export default async function ConnectedPage({
  searchParams,
}: {
  searchParams: Promise<{ app?: string; status?: string }>;
}) {
  const { app, status } = await searchParams;
  const name = (app && NAMES[app]) || "Your app";
  const failed = status !== undefined && status !== "success";

  return (
    <>
      <SiteHeader links={false} />
      <main id="main" className={styles.main}>
        <h1 className={styles.title}>{failed ? `${name} wasn’t connected` : `${name} is connected`}</h1>
        <p className={styles.text}>
          {failed
            ? "The connection didn’t finish. Close this window and try Connect again from the action card."
            : "Nexus can now do the actions you approve there. This window closes itself; if it doesn’t, close it and go back to Nexus."}
        </p>
        {failed ? null : <CloseWhenDone />}
      </main>
    </>
  );
}
