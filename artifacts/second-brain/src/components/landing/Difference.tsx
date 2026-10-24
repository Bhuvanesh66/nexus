import { cssVars } from "@/lib/css";
import styles from "./Difference.module.css";
import { DifferenceRows } from "./DifferenceRows";

/** The contrast the product is built on: the same request, answered by generic AI and done by Nexus. */
export function Difference() {
  return (
    <section id="different" className={styles.section} aria-labelledby="different-title">
      <div className={styles.grid}>
        <h2 id="different-title" className={styles.heading} data-reveal="" style={cssVars({ "--i": 0 })}>
          <span className={styles.headLine}>Generic AI answers.</span>{" "}
          <span className={styles.headLine}>Nexus does.</span>
        </h2>
        <DifferenceRows />
      </div>
    </section>
  );
}
