import { NexusMark } from "@/components/icons";
import { SIGN_IN_HREF } from "@/lib/site";
import styles from "./SiteHeader.module.css";

export function SiteHeader({ links = true }: { links?: boolean }) {
  return (
    <header className={styles.header}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <a href="/" className={styles.wordmark}>
        <NexusMark size={24} />
        <span translate="no">Nexus</span>
      </a>
      <nav aria-label="Primary">
        <ul className={styles.links}>
          {links ? (
            <>
              <li className={styles.wide}>
                <a href="/#demo">See it work</a>
              </li>
              <li className={styles.wide}>
                <a href="/#different">Why Nexus</a>
              </li>
            </>
          ) : null}
          <li>
            <a href={SIGN_IN_HREF} className={styles.signIn}>
              Sign in
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
