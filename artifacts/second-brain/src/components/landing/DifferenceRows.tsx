
import { useState } from "react";
import { KindIcon } from "@/components/demo/KindIcon";
import {
  CAPTURE_BY_ID,
  KIND_LABEL,
  TASK_BY_ID,
  savedLabel,
  type AnswerPart,
  type CaptureId,
} from "@/components/demo/demo-data";
import { CheckIcon, GlobeIcon, VaultMark } from "@/components/icons";
import { cssVars } from "@/lib/css";
import styles from "./Difference.module.css";

/** The demo's application task, shown still: the same form question answered by generic AI and done by Nexus. */
const TASK = TASK_BY_ID.apply;

/** The fragments the Nexus answer draws on, in the order they appear in the Vault. */
const USED: readonly CaptureId[] = ["metrics", "pitch", "team"];

const SENT_TO = TASK.items.map((item) => item.name.replace(" Accelerator", ""));

/**
 * Three states of one application answer: without your Vault, the fragments it draws on, and the answer that
 * uses them and is sent. The fragments are live: pointing at one, or choosing it, lights the words it produced.
 */
export function DifferenceRows() {
  const [selected, setSelected] = useState<CaptureId>("metrics");
  const [hovered, setHovered] = useState<CaptureId | null>(null);
  const active = hovered ?? selected;
  const source = {
    onHover: setHovered,
    onSelect: setSelected,
  };

  return (
    <>
      <div className={styles.row} data-reveal="" style={cssVars({ "--i": 1 })}>
        <h3 className={styles.rowLabel} data-tone="generic">
          Generic AI
        </h3>
        <div className={styles.frag} data-ui="">
          <p className={styles.prompt}>{TASK.preview.label}</p>
          <Answer parts={TASK.generic.parts} active={null} {...source} />
          <p className={styles.foot}>
            <GlobeIcon size={14} />
            General knowledge only. 0 fragments used. Nothing sent.
          </p>
        </div>
        <p className={styles.rowNote}>
          Fluent, but it doesn’t know your numbers, so it reaches for the buzzwords partners skip. Then it stops.
        </p>
      </div>

      <div className={styles.row} data-reveal="" style={cssVars({ "--i": 2 })}>
        <h3 className={styles.rowLabel} data-tone="yours">
          What you dropped
        </h3>
        <div className={styles.frag} data-ui="">
          <p className={styles.fragTitle} id="saved-title">
            <VaultMark size={14} />
            In your Vault
          </p>
          <ul className={styles.notes} aria-labelledby="saved-title">
            {USED.map((id) => {
              const capture = CAPTURE_BY_ID[id];
              return (
                <li key={id}>
                  <button
                    type="button"
                    className={styles.note}
                    data-kind={capture.kind}
                    aria-pressed={selected === id}
                    data-hit={active === id ? "true" : undefined}
                    aria-describedby="saved-hint"
                    onPointerEnter={() => setHovered(id)}
                    onPointerLeave={() => setHovered(null)}
                    onFocus={() => setHovered(id)}
                    onBlur={() => setHovered(null)}
                    onClick={() => setSelected(id)}
                  >
                    <KindIcon kind={capture.kind} />
                    <span className={styles.noteText}>
                      <span className={styles.noteTitle}>{capture.title}</span>
                      <span className={styles.noteMeta}>
                        {KIND_LABEL[capture.kind]} · dropped {savedLabel(capture)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p id="saved-hint" className="sr-only">
            Highlights the words this fragment produced in the Nexus answer.
          </p>
        </div>
        <p className={styles.rowNote}>
          Dropped over two months, with no folders or tags. Point at one to see the words it produced.
        </p>
      </div>

      <div className={styles.row} data-reveal="" style={cssVars({ "--i": 3 })}>
        <h3 className={styles.rowLabel} data-tone="nexus">
          Nexus
        </h3>
        <div className={styles.frag} data-ui="">
          <p className={styles.prompt}>{TASK.preview.label}</p>
          <Answer parts={TASK.preview.parts} active={active} {...source} />
          <p className={styles.sent}>
            <CheckIcon size={14} />
            Sent to {SENT_TO.slice(0, -1).join(", ")} and {SENT_TO.at(-1)}.
          </p>
          <p className={styles.foot}>
            <VaultMark size={14} />
            {USED.length} fragments used, plus general knowledge.
          </p>
        </div>
        <p className={styles.rowNote}>
          The same question, answered with your own numbers, then sent to all three. Done, not just answered.
        </p>
      </div>
    </>
  );
}

interface AnswerProps {
  parts: readonly AnswerPart[];
  active: CaptureId | null;
  onHover: (id: CaptureId | null) => void;
  onSelect: (id: CaptureId) => void;
}

/** An answer the way the app writes it: each sentence followed by the fragment it came from. */
function Answer({ parts, active, onHover, onSelect }: AnswerProps) {
  return (
    <div className={styles.answer}>
      <p>
        {parts.map((part) => {
          const hit = active !== null && (part.from ?? []).includes(active);
          return (
            <span key={part.text}>
              <span className={styles.part} data-hit={hit ? "true" : undefined}>
                {part.text}
              </span>
              {(part.from ?? []).map((id) => (
                <button
                  key={id}
                  type="button"
                  className={styles.chip}
                  data-kind="brain"
                  data-hit={active === id ? "true" : undefined}
                  aria-label={`From your Vault: ${CAPTURE_BY_ID[id].title}`}
                  onPointerEnter={() => onHover(id)}
                  onPointerLeave={() => onHover(null)}
                  onFocus={() => onHover(id)}
                  onBlur={() => onHover(null)}
                  onClick={() => onSelect(id)}
                >
                  <VaultMark size={11} />
                  {CAPTURE_BY_ID[id].short}
                </button>
              ))}
              {part.general ? (
                <span className={styles.chip} data-kind="general">
                  <GlobeIcon size={11} />
                  General knowledge
                </span>
              ) : null}{" "}
            </span>
          );
        })}
      </p>
    </div>
  );
}
