import Link from "next/link";
import { DemoSection } from "@/components/demo/DemoSection";
import { ArticleIcon, NoteIcon, PostIcon, YouTubeIcon } from "@/components/icons";
import { cssVars } from "@/lib/css";
import { SIGN_IN_HREF } from "@/lib/site";
import styles from "./Hero.module.css";
import { WatchDemoLink } from "./WatchDemoLink";

const HEADLINE = ["Stop collecting.", "Start remembering.", "Start doing."];

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.copy}>
        <div>
          <h1 id="hero-title" className={styles.title}>
            {HEADLINE.map((line, i) => (
              <span key={line} className={styles.line}>
                <span style={cssVars({ "--i": i })}>{line}</span>
              </span>
            ))}
          </h1>
          <p className={`${styles.lead} ${styles.load}`}>
            Drop in what you learn. Second Brain connects the dots and brings the right insights back when you have
            something real to do.
          </p>
          <div className={`${styles.actions} ${styles.load}`}>
            {/* Never prefetch sign-in: once it starts a real OAuth flow, a prefetch must not touch it. */}
            <Link className="button" href={SIGN_IN_HREF} prefetch={false}>
              Try Free with Google
            </Link>
            <WatchDemoLink className={styles.watch} iconClassName={styles.watchIcon} />
          </div>
          <p className={`${styles.note} ${styles.load}`}>
            No folders. No manual tagging. Just save it and get back to work.
          </p>
        </div>

        <p className={`${styles.sources} ${styles.load}`} style={cssVars({ "--delay": "560ms" })}>
          <span className={styles.sourceIcons} aria-hidden="true">
            <YouTubeIcon size={18} />
            <ArticleIcon size={18} />
            <PostIcon size={18} />
            <NoteIcon size={18} />
          </span>
          Save YouTube links, articles, tweets and typed notes.
        </p>
      </div>

      <div className={styles.demo}>
        <DemoSection />
      </div>
    </section>
  );
}
