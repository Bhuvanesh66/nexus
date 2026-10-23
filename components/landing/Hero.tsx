import Link from "next/link";
import { DemoSection } from "@/components/demo/DemoSection";
import { ArrowIcon, ArticleIcon, NoteIcon, PostIcon, YouTubeIcon } from "@/components/icons";
import { cssVars } from "@/lib/css";
import { SIGN_IN_HREF } from "@/lib/site";
import styles from "./Hero.module.css";
import { WatchDemoLink } from "./WatchDemoLink";

const HEADLINE = ["Beyond", "memory."];

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.copy}>
        <div>
          <h1 id="hero-title" className={styles.title}>
            {HEADLINE.map((line, i) => (
              <span key={line} className={styles.line}>
                {i > 0 ? " " : null}
                <span className={i === 1 ? styles.tone : undefined} style={cssVars({ "--i": i })}>
                  {line}
                </span>
              </span>
            ))}
          </h1>
          <p className={`${styles.lead} ${styles.load}`}>
            Nexus is where everything you’ve learned meets the task you’re doing&nbsp;— and the work gets done.
          </p>
          <div className={`${styles.actions} ${styles.load}`}>
            {/* Never prefetch sign-in: once it starts a real OAuth flow, a prefetch must not touch it. */}
            <Link className="button" href={SIGN_IN_HREF} prefetch={false}>
              Try Nexus free
              <ArrowIcon className="button-arrow" size={18} weight={2.25} />
            </Link>
            <WatchDemoLink className={styles.watch} iconClassName={styles.watchIcon} />
          </div>
          <p className={`${styles.trust} ${styles.load}`}>No credit card. Free during beta.</p>
        </div>

        <div className={`${styles.foot} ${styles.load}`} style={cssVars({ "--delay": "560ms" })}>
          <p className={styles.note}>No folders. No tagging. No setup. Just drop fragments — Nexus handles the rest.</p>
          <p className={styles.sources}>
            <span className={styles.sourceIcons} aria-hidden="true">
              <YouTubeIcon size={18} />
              <ArticleIcon size={18} />
              <PostIcon size={18} />
              <NoteIcon size={18} />
            </span>
            Drop YouTube links, articles, tweets and typed notes.
          </p>
        </div>
      </div>

      <div className={styles.demo}>
        <DemoSection />
      </div>
    </section>
  );
}
