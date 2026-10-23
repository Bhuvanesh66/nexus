import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { cssVars } from "@/lib/css";
import { SIGN_IN_HREF } from "@/lib/site";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.board}>
        <div className={`${styles.tile} ${styles.scope}`} data-reveal="" style={cssVars({ "--i": 0 })}>
          <p className={styles.scopeText}>This demo runs in your browser. Nothing is saved.</p>
          <p className={styles.small}>People and notes in the demo are illustrative samples.</p>
        </div>

        <nav className={`${styles.tile} ${styles.nav}`} aria-label="Footer" data-reveal="" style={cssVars({ "--i": 1 })}>
          <ul className={styles.navList}>
            <li>
              <a href="#demo">See it work</a>
            </li>
            <li>
              <a href="#different">Why Nexus</a>
            </li>
            <li>
              <Link href={SIGN_IN_HREF} prefetch={false}>
                Sign in
              </Link>
            </li>
          </ul>
        </nav>

        <div className={`${styles.tile} ${styles.event}`} data-reveal="" style={cssVars({ "--i": 2 })}>
          <p className={styles.eventText}>
            © 2026 <span translate="no">Nexus</span>. Built for Airtribe AI Builders Day ’26 —{" "}
            <time dateTime="2026-10-24">October 24</time>, Bengaluru.
          </p>
        </div>

        <div className={`${styles.tile} ${styles.mark}`} data-reveal="" style={cssVars({ "--i": 1 })}>
          <p className={styles.wordmark} translate="no">
            Nexus
          </p>
        </div>

        <div className={`${styles.tile} ${styles.cta}`} data-reveal="" style={cssVars({ "--i": 2 })}>
          <h2 className={styles.ctaHeading}>The layer that comes after notebooks.</h2>
          <Link href={SIGN_IN_HREF} prefetch={false} className={styles.ctaButton}>
            Try Nexus free
            <ArrowIcon className={styles.arrow} size={18} weight={2.25} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
