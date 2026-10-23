import Link from "next/link";
import { NexusMark } from "@/components/icons";
import { SIGN_IN_HREF } from "@/lib/site";
import styles from "./SiteHeader.module.css";

export function SiteHeader({ links = true }: { links?: boolean }) {
  return (
    <header className={styles.header}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Link href="/" className={styles.wordmark}>
        <NexusMark size={24} />
        <span translate="no">Nexus</span>
      </Link>
      <nav aria-label="Primary">
        <ul className={styles.links}>
          {links ? (
            <>
              <li className={styles.wide}>
                <Link href="/#demo">See it work</Link>
              </li>
              <li className={styles.wide}>
                <Link href="/#different">Why Nexus</Link>
              </li>
            </>
          ) : null}
          <li>
            <a href={SIGN_IN_HREF}>
              Sign in
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
