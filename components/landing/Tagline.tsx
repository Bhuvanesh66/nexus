import { cssVars } from "@/lib/css";
import styles from "./Tagline.module.css";

/**
 * The tagline as stripes of colour, the answer to "Until now." above it. After the drop, the stripes are the
 * three layers of Nexus, built from the floor up: it remembers, it learns on top of memory, and it acts on top
 * of that. Memory is where most tools stop; the two layers above it are the difference, and what "beyond
 * memory" means.
 */
const LINES = [
  {
    line: "Stop collecting.",
    tone: "teal",
    label: "Drop · Absorb",
    note: "Drop a reel, a link or a voice note once. Nexus absorbs it.",
  },
  {
    line: "Start remembering.",
    tone: "sky",
    layer: 1,
    label: "Layer 1 · Memory",
    note: "Nexus remembers everything you drop, stitched to what you already know.",
    turn: "Most tools stop here.",
  },
  {
    line: "Start learning.",
    tone: "blue",
    layer: 2,
    label: "Layer 2 · Learning",
    note: "Nexus doesn’t. On top of memory, it learns what matters to you: your numbers, your people, how you work.",
  },
  {
    line: "Start doing.",
    tone: "indigo",
    layer: 3,
    label: "Layer 3 · Execution",
    note: "On top of that, it acts. You name the task; the brief gets written, the email sent, the applications in.",
    turn: "That’s beyond memory.",
  },
] as const;

/** Three stacked layers, memory at the bottom, with this stripe's layer filled and the ones under it held. */
function LayerGlyph({ layer }: { layer: 1 | 2 | 3 }) {
  return (
    <svg className={styles.glyph} width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" focusable="false">
      {[3, 2, 1].map((level) => (
        <rect
          key={level}
          x="2"
          y={2 + (3 - level) * 6.5}
          width="18"
          height="4.5"
          rx="1.5"
          fill="currentColor"
          fillOpacity={level === layer ? 1 : level < layer ? 0.45 : 0}
          stroke="currentColor"
          strokeWidth="1.2"
        />
      ))}
    </svg>
  );
}

export function Tagline() {
  return (
    <section
      className={styles.tagline}
      aria-label="Stop collecting. Start remembering. Start learning. Start doing. Beyond memory."
    >
      {LINES.map((item) => (
        <div key={item.line} className={styles.stripe} data-tone={item.tone}>
          <h2 className={styles.line} data-reveal="" style={cssVars({ "--i": 0 })}>
            {item.line}
          </h2>
          <p className={styles.note} data-reveal="" style={cssVars({ "--i": 1 })}>
            <b className={styles.label}>
              {"layer" in item ? <LayerGlyph layer={item.layer} /> : null}
              {item.label}
            </b>
            <span>
              {item.note}
              {"turn" in item ? (
                <>
                  {" "}
                  <strong className={styles.turn}>{item.turn}</strong>
                </>
              ) : null}
            </span>
          </p>
        </div>
      ))}
    </section>
  );
}
