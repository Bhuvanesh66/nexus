import { cssVars } from "@/lib/css";
import styles from "./Eras.module.css";

/**
 * The category in three eras. Each era carries a bar on one time scale: 200,000 years fills a column, so
 * the shelf's 5,000 years is a sliver (2.5%) and the third era, which begins now, is a single point.
 */
const ERAS = [
  {
    era: "Era 1",
    name: "The Mind",
    tone: "teal",
    span: "200,000 years",
    scale: 1,
    text: "You remembered what you lived.",
    turn: "Then volume outgrew the skull.",
  },
  {
    era: "Era 2",
    name: "The Shelf",
    tone: "blue",
    span: "5,000 years",
    scale: 5_000 / 200_000,
    text: "Books, files, Notion. You stored it, you fetched it.",
    turn: "Then fragments arrived too fast to shelve.",
  },
  {
    era: "Era 3",
    name: "Nexus",
    tone: "indigo",
    span: "Begins now",
    scale: 0,
    text: "The right fragment doesn’t just arrive.",
    turn: "It gets used on the spot, in the task you’re already doing.",
  },
] as const;

export function Eras() {
  return (
    <section id="eras" className={styles.section} aria-labelledby="eras-title">
      <div className={styles.grid}>
        <h2 id="eras-title" className={styles.heading} data-reveal="" style={cssVars({ "--i": 0 })}>
          <span className={styles.headLine}>Memory had two eras.</span>{" "}
          <span className={styles.headLine}>We’re building the third.</span>
        </h2>
        <ol className={styles.eras}>
          {ERAS.map((era, i) => (
            <li
              key={era.name}
              className={styles.era}
              data-tone={era.tone}
              data-now={era.scale === 0 ? "" : undefined}
              data-reveal=""
              style={cssVars({ "--i": i + 1 })}
            >
              <span className={styles.time} aria-hidden="true">
                {era.scale > 0 ? (
                  <span className={styles.bar} style={cssVars({ "--scale": era.scale })} />
                ) : (
                  <span className={styles.point} />
                )}
              </span>
              <h3 className={styles.name}>
                <span className="sr-only">{era.era}: </span>
                <span translate={era.scale === 0 ? "no" : undefined}>{era.name}</span>
              </h3>
              <p className={styles.text}>
                <b className={styles.span}>{era.span}.</b> {era.text} <span className={styles.turn}>{era.turn}</span>
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
