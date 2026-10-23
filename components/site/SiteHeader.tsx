import Link from "next/link";
import { BrainMark } from "@/components/icons";
import { SIGN_IN_HREF } from "@/lib/site";
import styles from "./SiteHeader.module.css";

export function SiteHeader({ links = true }: { links?: boolean }) {
  return (
    <header className={styles.header}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Link href="/" className={styles.wordmark}>
        <BrainMark size={22} />
        <span translate="no">Second Brain</span>
      </Link>
      <nav aria-label="Primary">
        <ul className={styles.links}>
          {links ? (
            <>
              <li className={styles.wide}>
                <Link href="/#demo">Demo</Link>
              </li>
              <li className={styles.wide}>
                <Link href="/#different">Why it’s different</Link>
              </li>
            </>
          ) : null}
          <li>
            <Link href={SIGN_IN_HREF} prefetch={false}>
              Sign in
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
