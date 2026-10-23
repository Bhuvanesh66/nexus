import { cssVars } from "@/lib/css";
import styles from "./WhyNow.module.css";

/** The shift Nexus is built for, proved with three published figures. Each is printed with its source. */
const STATS = [
  {
    figure: "919%",
    tone: "teal",
    spoken: "919 percent",
    context: "Creator economy growth in India, 2020 to early 2026.",
    source: "Indeed, 2026",
  },
  {
    figure: "80M",
    tone: "sky",
    spoken: "80 million",
    context: "Creators in India today.",
    source: "Kalaari Capital, Creator Economy Report",
  },
  {
    figure: "$1T+",
    tone: "violet",
    spoken: "More than 1 trillion dollars",
    context: "Creator-influenced consumer spending in India by 2030.",
    source: "BCG, From Content to Commerce, 2025",
  },
] as const;

export function WhyNow() {
  return (
    <section id="why-now" className={styles.section} aria-labelledby="why-now-title">
      <div className={styles.grid}>
        <div className={styles.head} data-reveal="" style={cssVars({ "--i": 0 })}>
          <h2 id="why-now-title" className={styles.heading}>
            The world is learning in fragments.
          </h2>
          <p className={styles.gap}>Nobody built the layer for that.</p>
        </div>
        <ul className={styles.stats}>
          {STATS.map((stat, i) => (
            <li
              key={stat.figure}
              className={styles.stat}
              data-tone={stat.tone}
              data-reveal=""
              style={cssVars({ "--i": i + 1 })}
            >
              <p className={styles.figure}>
                <span aria-hidden="true">{stat.figure}</span>
                <span className="sr-only">{stat.spoken}</span>
              </p>
              <p className={styles.context}>{stat.context}</p>
              <p className={styles.source}>Source: {stat.source}</p>
            </li>
          ))}
        </ul>
        <p className={styles.turn} data-reveal="" style={cssVars({ "--i": 4 })}>
          Until now.
        </p>
      </div>
    </section>
  );
}
