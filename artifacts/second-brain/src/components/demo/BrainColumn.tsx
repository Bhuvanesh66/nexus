import { memo } from "react";
import { cssVars } from "@/lib/css";
import { Beat } from "./Beat";
import { KindIcon } from "./KindIcon";
import {
  BEATS,
  CAPTURES,
  KIND_LABEL,
  NEW_CAPTURE_ID,
  savedLabel,
  type Capture,
  type CaptureId,
  type Task,
} from "./demo-data";

interface SourceHandlers {
  onHover: (id: CaptureId | null) => void;
  onSelect: (id: CaptureId) => void;
}

interface BrainColumnProps extends SourceHandlers {
  task: Task;
  focusId: CaptureId | null;
  selected: CaptureId | null;
}

export const BrainColumn = memo(function BrainColumn({ task, focusId, selected, onHover, onSelect }: BrainColumnProps) {
  return (
    <div className="sb-brain">
      <div className="sb-brain-head">
        <span className="sb-brain-title">Your Vault</span>
        <span className="sb-brain-count">
          <Beat out="capture" o={BEATS.capture.slot}>
            {CAPTURES.length - 1} fragments
          </Beat>
          <Beat at="capture" d={BEATS.capture.slot} a="sb-fade">
            {CAPTURES.length} fragments
          </Beat>
        </span>
      </div>
      <ul className="sb-cards" data-observe="">
        {CAPTURES.map((capture) => {
          const recallIndex = task.recalled.indexOf(capture.id);
          const card = (
            <CaptureCard
              capture={capture}
              recallIndex={recallIndex}
              hit={focusId === capture.id}
              pressed={selected === capture.id}
              onHover={onHover}
              onSelect={onSelect}
            />
          );
          if (capture.id !== NEW_CAPTURE_ID) return <li key={capture.id}>{card}</li>;
          return (
            <li key={capture.id} className="sb-slot" style={cssVars({ "--slot": BEATS.capture.slot })}>
              <div className="sb-slot-inner">
                <Beat as="div" at="capture" d={BEATS.capture.card}>
                  {card}
                </Beat>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
});

interface CaptureCardProps extends SourceHandlers {
  capture: Capture;
  /** Position in the task's surface order, or -1 when this task does not use the fragment. */
  recallIndex: number;
  hit: boolean;
  pressed: boolean;
}

function CaptureCard({ capture, recallIndex, hit, pressed, onHover, onSelect }: CaptureCardProps) {
  const recalled = recallIndex >= 0;
  return (
    <button
      type="button"
      className="sb-card"
      data-capture-id={capture.id}
      data-kind={capture.kind}
      data-recalled={recalled}
      data-hit={hit ? "true" : undefined}
      aria-pressed={pressed}
      aria-describedby="sb-source-hint"
      style={recalled ? cssVars({ "--lit": BEATS.recall.first + recallIndex * BEATS.recall.gap }) : undefined}
      onPointerEnter={() => onHover(capture.id)}
      onPointerLeave={() => onHover(null)}
      onFocus={() => onHover(capture.id)}
      onBlur={() => onHover(null)}
      onClick={() => onSelect(capture.id)}
    >
      <KindIcon kind={capture.kind} />
      <span className="sb-card-text">
        <span className="sb-card-title">{capture.title}</span>
        <span className="sb-card-meta">
          {KIND_LABEL[capture.kind]} · {savedLabel(capture)}
        </span>
      </span>
      {capture.id === NEW_CAPTURE_ID ? (
        <Beat out="ask" className="sb-new">
          New
        </Beat>
      ) : null}
    </button>
  );
}
