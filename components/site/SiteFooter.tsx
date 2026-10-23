import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { cssVars } from "@/lib/css";
import { SIGN_IN_HREF } from "@/lib/site";
import styles from "./SiteFooter.module.css";

// A fixed locale and time zone keep the server and the browser on the same string.
const EVENT_DATE = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date("2026-10-24T00:00:00Z"));

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.board}>
        <div className={`${styles.tile} ${styles.statement}`} data-reveal="" style={cssVars({ "--i": 0 })}>
          <h2 className={styles.statementText}>Your knowledge, put to work.</h2>
          <p className={styles.small}>
            © 2026 Second Brain. People and notes in the demo are illustrative samples.
          </p>
        </div>

        <nav className={`${styles.tile} ${styles.nav}`} aria-label="Footer" data-reveal="" style={cssVars({ "--i": 1 })}>
          <ul className={styles.navList}>
            <li>
              <a href="#demo">See the demo</a>
            </li>
            <li>
              <a href="#different">Why it’s different</a>
            </li>
            <li>
              <Link href={SIGN_IN_HREF} prefetch={false}>
                Sign in
              </Link>
            </li>
          </ul>
        </nav>

        <div className={`${styles.tile} ${styles.event}`} data-reveal="" style={cssVars({ "--i": 2 })}>
          <p>Built for Airtribe AI Builders Day ’26</p>
          <p className={styles.small}>
            <time dateTime="2026-10-24">{EVENT_DATE}</time>
          </p>
        </div>

        <div className={`${styles.tile} ${styles.scope}`} data-reveal="" style={cssVars({ "--i": 3 })}>
          <p className={styles.scopeText}>
            The demo above runs on sample notes in your browser. Nothing you click there is saved or sent.
          </p>
        </div>

        <div className={`${styles.tile} ${styles.mark}`} data-reveal="" style={cssVars({ "--i": 1 })}>
          <p className={styles.wordmark} translate="no">
            Second Brain
          </p>
        </div>

        <Link
          href={SIGN_IN_HREF}
          prefetch={false}
          className={`${styles.tile} ${styles.cta}`}
          data-reveal=""
          style={cssVars({ "--i": 2 })}
        >
          <span className={styles.ctaText}>Try Free with Google</span>
          <ArrowIcon className={styles.arrow} size={56} />
        </Link>
      </div>
    </footer>
  );
}
