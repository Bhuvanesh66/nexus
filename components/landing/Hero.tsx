import { DemoSection } from "@/components/demo/DemoSection";
import { ArrowIcon, InstagramLogo, PdfLogo, XLogo, YouTubeShortsLogo } from "@/components/icons";
import { cssVars } from "@/lib/css";
import { SIGN_IN_HREF } from "@/lib/site";
import styles from "./Hero.module.css";
import { WatchDemoLink } from "./WatchDemoLink";

const HEADLINE = ["Beyond", "memory."];

/** The fragments people drop most, each with its own mark and the kind of link or file it arrives as. */
const DROPS = [
  { name: "Instagram reels", example: "instagram.com/reel/…", Logo: InstagramLogo },
  { name: "YouTube Shorts", example: "youtube.com/shorts/…", Logo: YouTubeShortsLogo },
  { name: "PDFs", example: "Seed-deck-v3.pdf", Logo: PdfLogo },
  { name: "Posts on X", example: "x.com/…/status/…", Logo: XLogo },
];

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
            <a className="button" href={SIGN_IN_HREF}>
              Try Nexus free
              <ArrowIcon className="button-arrow" size={18} weight={2.25} />
            </a>
            <WatchDemoLink className={styles.watch} iconClassName={styles.watchIcon} />
          </div>
          <p className={`${styles.trust} ${styles.load}`}>No credit card. Free during beta.</p>
        </div>

        <div className={`${styles.foot} ${styles.load}`} style={cssVars({ "--delay": "560ms" })}>
          <p className={styles.note}>No folders. No tagging. No setup. Just drop fragments — Nexus handles the rest.</p>
          {/* the app's own sources panel, so it keeps the interface's borders (data-ui) */}
          <ul className={styles.drops} data-ui="" aria-label="What you can drop">
            {DROPS.map(({ name, example, Logo }) => (
              <li key={name} className={styles.drop}>
                <Logo size={34} />
                <span className={styles.dropText}>
                  <span className={styles.dropName}>{name}</span>
                  <span className={styles.dropExample}>{example}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.demo}>
        <DemoSection />
      </div>
    </section>
  );
}
