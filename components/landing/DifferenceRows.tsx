"use client";

import { useState } from "react";
import { KindIcon } from "@/components/demo/KindIcon";
import {
  CAPTURE_BY_ID,
  KIND_LABEL,
  TASK_BY_ID,
  savedLabel,
  type AnswerRow,
  type CaptureId,
} from "@/components/demo/demo-data";
import { BrainMark, GlobeIcon } from "@/components/icons";
import { cssVars } from "@/lib/css";
import styles from "./Difference.module.css";

/** The demo's "Draft an email" task, shown still and annotated: the same request answered with and without a Brain. */
const TASK = TASK_BY_ID.email;

/**
 * Three states of one email: without your Brain, the captures it draws on, and the email that uses them.
 * The captures are live: pointing at one, or choosing it, lights the words it produced.
 */
export function DifferenceRows() {
  const [selected, setSelected] = useState<CaptureId>("numbers");
  const [hovered, setHovered] = useState<CaptureId | null>(null);
  const active = hovered ?? selected;
  const source = {
    onHover: setHovered,
    onSelect: setSelected,
  };

  return (
    <>
      <div className={styles.row} data-reveal="" style={cssVars({ "--i": 1 })}>
        <h3 className={styles.rowLabel}>Generic AI</h3>
        <div className={styles.frag} data-ui="">
          <p className={styles.prompt}>{TASK.prompt}</p>
          <Email rows={TASK.generic} active={null} {...source} />
          <p className={styles.foot}>
            <GlobeIcon size={14} />
            General knowledge only. 0 memories used.
          </p>
        </div>
        <p className={styles.rowNote}>Fluent and polite. It doesn’t know Rajesh, so it reaches for the buzzwords he dislikes.</p>
      </div>

      <div className={styles.row} data-reveal="" style={cssVars({ "--i": 2 })}>
        <h3 className={styles.rowLabel}>What you saved</h3>
        <div className={styles.frag} data-ui="">
          <p className={styles.fragTitle} id="saved-title">
            <BrainMark size={14} />
            In your Brain
          </p>
          <ul className={styles.notes} aria-labelledby="saved-title">
            {TASK.recalled.map((id) => {
              const capture = CAPTURE_BY_ID[id];
              return (
                <li key={id}>
                  <button
                    type="button"
                    className={styles.note}
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
                        {KIND_LABEL[capture.kind]} · saved {savedLabel(capture)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p id="saved-hint" className="sr-only">
            Highlights the words this capture produced in the Second Brain email.
          </p>
        </div>
        <p className={styles.rowNote}>
          Saved over six weeks, with no folders or tags. Point at one to see the words it produced.
        </p>
      </div>

      <div className={styles.row} data-reveal="" style={cssVars({ "--i": 3 })}>
        <h3 className={styles.rowLabel}>Second Brain</h3>
        <div className={styles.frag} data-ui="">
          <p className={styles.prompt}>{TASK.prompt}</p>
          <Email rows={TASK.rows} active={active} {...source} />
          <p className={styles.foot}>
            <BrainMark size={14} />
            {TASK.recalled.length} memories used, plus general knowledge.
          </p>
        </div>
        <p className={styles.rowNote}>
          The same request, written in numbers, because you once noted that Rajesh prefers them.
        </p>
      </div>
    </>
  );
}

interface EmailProps {
  rows: readonly AnswerRow[];
  active: CaptureId | null;
  onHover: (id: CaptureId | null) => void;
  onSelect: (id: CaptureId) => void;
}

/** An email laid out the way the app drafts it: a subject line, then the body, each sentence with its source. */
function Email({ rows, active, onHover, onSelect }: EmailProps) {
  return (
    <div className={styles.email}>
      {rows.map((row) => (
        <p key={row.label} className={row.label === "Subject" ? styles.subject : styles.body}>
          {row.label === "Subject" ? <span className={styles.fieldLabel}>Subject</span> : null}
          {row.parts.map((part) => {
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
                    aria-label={`From your Brain: ${CAPTURE_BY_ID[id].title}`}
                    onPointerEnter={() => onHover(id)}
                    onPointerLeave={() => onHover(null)}
                    onFocus={() => onHover(id)}
                    onBlur={() => onHover(null)}
                    onClick={() => onSelect(id)}
                  >
                    <BrainMark size={11} />
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
      ))}
    </div>
  );
}
