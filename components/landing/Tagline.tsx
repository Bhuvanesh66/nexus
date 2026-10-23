import { cssVars } from "@/lib/css";
import styles from "./Tagline.module.css";

/**
 * The tagline as three stripes of colour, the answer to "Until now." above it. Each line names two steps of
 * the demo's loop and says what they do.
 */
const LINES = [
  {
    line: "Stop collecting.",
    tone: "pink",
    steps: "Drop · Absorb",
    note: "Drop a reel, a link or a voice note once. Nexus absorbs it and keeps what matters.",
  },
  {
    line: "Start remembering.",
    tone: "amber",
    steps: "Connect · Surface",
    note: "Every fragment is stitched to what you already know, and surfaces at the moment that matters.",
  },
  {
    line: "Start doing.",
    tone: "violet",
    steps: "Hand off · Deliver",
    note: "You name the task. Nexus does it with you: the brief, the email, the plan.",
  },
] as const;

export function Tagline() {
  return (
    <section className={styles.tagline} aria-label="Stop collecting. Start remembering. Start doing.">
      {LINES.map((item) => (
        <div key={item.line} className={styles.stripe} data-tone={item.tone}>
          <h2 className={styles.line} data-reveal="" style={cssVars({ "--i": 0 })}>
            {item.line}
          </h2>
          <p className={styles.note} data-reveal="" style={cssVars({ "--i": 1 })}>
            <b>{item.steps}</b>
            {item.note}
          </p>
        </div>
      ))}
    </section>
  );
}
