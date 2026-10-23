import { cssVars } from "@/lib/css";
import styles from "./Difference.module.css";
import { DifferenceRows } from "./DifferenceRows";

/** The contrast the product is built on: the same request, answered with and without what the visitor saved. */
export function Difference() {
  return (
    <section id="different" className={styles.section} aria-labelledby="different-title">
      <div className={styles.grid}>
        <h2 id="different-title" className={styles.heading} data-reveal="" style={cssVars({ "--i": 0 })}>
          <span className={styles.headLine}>Not just what AI knows.</span>{" "}
          <span className={styles.headLine}>What you’ve learned, too.</span>
        </h2>
        <DifferenceRows />
      </div>
    </section>
  );
}
