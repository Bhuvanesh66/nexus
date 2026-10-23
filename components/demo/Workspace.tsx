import { memo } from "react";
import { BrainMark, CheckIcon, GlobeIcon, LinkIcon, YouTubeIcon } from "@/components/icons";
import { cssVars } from "@/lib/css";
import { Beat } from "./Beat";
import {
  BEATS,
  CAPTURE_BY_ID,
  CONNECTIONS,
  NEW_CAPTURE_INSIGHT as INSIGHT,
  type AnswerPart,
  type AnswerRow,
  type AppTab,
  type CaptureId,
  type StageId,
  type Task,
} from "./demo-data";
import type { AnswerView } from "./demo-machine";

type Moment = readonly [StageId, number];

/** The done label waits for the running label to leave, so the two never overlap. */
const HANDOVER = 160;

/** A processing step that reads "Label…" while it runs and gets a check when it is done. */
function ProcessStep({
  label,
  doneLabel = label,
  active,
  done,
  pending = false,
}: {
  label: string;
  doneLabel?: string;
  active: Moment;
  done: Moment;
  pending?: boolean;
}) {
  return (
    <span className="sb-pstep">
      {pending ? (
        <Beat out={active[0]} o={active[1]} className="sb-pending">
          {label}
        </Beat>
      ) : null}
      <Beat at={active[0]} d={active[1]} a="sb-fade">
        <Beat out={done[0]} o={done[1]} className="sb-active">
          {label}…
        </Beat>
      </Beat>
      <Beat at={done[0]} d={done[1] + HANDOVER} a="sb-fade" className="sb-done">
        <CheckIcon size={12} />
        {doneLabel}
      </Beat>
    </span>
  );
}

export const DumpView = memo(function DumpView({ tab }: { tab: AppTab }) {
  const B = BEATS.capture;
  const U = BEATS.understand;
  const C = BEATS.connect;
  return (
    <div className="sb-view" data-view="dump" inert={tab !== "dump"} aria-hidden={tab !== "dump"}>
      <div className="sb-composer">
        <span className="sb-stack">
          <Beat out="capture" o={B.link} className="sb-placeholder">
            Paste a link, type a note, dump anything you just learned…
          </Beat>
          <Beat at="capture" d={B.link} a="sb-fade" className="sb-linktext">
            <YouTubeIcon size={14} />
            <span>{INSIGHT.link}</span>
          </Beat>
        </span>
        <span className="sb-btn" data-press="capture" style={cssVars({ "--p": B.send })}>
          Send
        </span>
      </div>

      <Beat as="article" at="capture" d={B.card} className="sb-capture" aria-label="New capture">
        <div className="sb-process">
          <ProcessStep label="Reading" active={["capture", B.card]} done={["understand", 0]} />
          <ProcessStep label="Understanding" pending active={["understand", 0]} done={["connect", 0]} />
          <ProcessStep label="Connecting" pending active={["connect", 0]} done={["connect", C.done]} />
        </div>

        <div className="sb-insight">
          <Beat at="understand" d={U.title} className="sb-insight-title">
            {INSIGHT.title}
          </Beat>
          <Beat at="understand" d={U.title} className="sb-insight-meta">
            <YouTubeIcon size={13} />
            {INSIGHT.source}
          </Beat>
          <p className="sb-summary">
            {INSIGHT.summary.map((chunk, i) => (
              <Beat key={chunk} at="understand" d={U.summary[i]} a="sb-fade">
                {chunk}{" "}
              </Beat>
            ))}
          </p>
          <Beat as="p" at="understand" d={U.takeaway} className="sb-takeaway">
            <b>Takeaway</b>
            {INSIGHT.takeaway}
          </Beat>
          <Beat as="p" at="understand" d={U.keywords} className="sb-keywords" aria-label="Keywords">
            {INSIGHT.keywords.map((keyword) => (
              <span key={keyword} className="sb-keyword">
                {keyword}
              </span>
            ))}
          </Beat>
        </div>

        <Beat as="div" at="connect" d={C.confirm} className="sb-connected">
          <p className="sb-connected-lead">Got it. Connected to 3 things you already saved:</p>
          <ul className="sb-relations">
            {CONNECTIONS.map((link, i) => (
              <Beat as="li" key={link.to} at="connect" d={C.pill + i * C.pillGap} className="sb-relation">
                <span className="sb-relation-pill">
                  <LinkIcon size={12} />
                  <span>Related to ‘{CAPTURE_BY_ID[link.to].short}’</span>
                </span>
                <span className="sb-reason">{link.reason}</span>
              </Beat>
            ))}
          </ul>
        </Beat>
      </Beat>
    </div>
  );
});

interface AskViewProps {
  tab: AppTab;
  task: Task;
  focusId: CaptureId | null;
  answer: AnswerView;
  onAnswer: (answer: AnswerView) => void;
  onHover: (id: CaptureId | null) => void;
  onSelect: (id: CaptureId) => void;
}

export const AskView = memo(function AskView({ tab, task, focusId, answer, onAnswer, onHover, onSelect }: AskViewProps) {
  const A = BEATS.ask;
  const R = BEATS.recall;
  const K = BEATS.create;
  const used = task.recalled.length;
  return (
    <div className="sb-view" data-view="ask" inert={tab !== "ask"} aria-hidden={tab !== "ask"}>
      <div className="sb-taskbox" data-task-anchor="">
        <span className="sb-stack">
          <Beat out="ask" o={A.task} className="sb-placeholder">
            What do you want to do?
          </Beat>
          <Beat at="ask" d={A.task} a="sb-fade" className="sb-tasktext">
            {task.prompt}
          </Beat>
        </span>
        <div className="sb-taskfoot">
          <Beat at="ask" d={A.mode} className="sb-mode">
            Mode: <b>{task.mode}</b>
          </Beat>
          <span className="sb-btn" data-press="ask" style={cssVars({ "--p": A.press })}>
            Ask
          </span>
        </div>
      </div>

      <Beat as="div" at="recall" a="sb-fade" className="sb-status" data-variant="brain">
        <div className="sb-status-steps">
          <ProcessStep
            label="Checking what you’ve taught me"
            doneLabel="Checked your Brain"
            active={["recall", 0]}
            done={["recall", R.checked]}
          />
          <ProcessStep
            label="Combining with general knowledge"
            doneLabel="Added general knowledge"
            active={["recall", R.general]}
            done={["recall", R.combined]}
          />
        </div>
        <div className="sb-status-sources">
          <span className="sb-memories">
            <BrainMark size={12} />
            <span className="sb-roll" aria-hidden="true">
              <span className="sb-roll-strip" style={cssVars({ "--n": used, "--d": R.first })}>
                {Array.from({ length: used + 1 }, (_, n) => (
                  <span key={n}>{n}</span>
                ))}
              </span>
            </span>
            <span className="sr-only">{used}</span> memories used
          </span>
          <Beat at="recall" d={R.general} className="sb-general">
            <GlobeIcon size={12} />
            General knowledge: <b>{task.generalTopic}</b>
          </Beat>
        </div>
      </Beat>
      <div className="sb-status" data-variant="generic">
        <GlobeIcon size={13} />
        <span className="sb-generic-note">General knowledge only. 0 memories used.</span>
      </div>

      <Beat as="div" at="create" className="sb-output" role="group" aria-label={task.outputTitle}>
        <div className="sb-output-head">
          <p className="sb-output-title">{task.outputTitle}</p>
          <Beat at="create" d={K.compare} className="sb-compare" role="group" aria-label="Compare answers">
            <button type="button" aria-pressed={answer === "brain"} onClick={() => onAnswer("brain")}>
              With your Brain
            </button>
            <button type="button" aria-pressed={answer === "generic"} onClick={() => onAnswer("generic")}>
              Generic AI
            </button>
          </Beat>
        </div>
        <Answer variant="brain" rows={task.rows} focusId={focusId} onHover={onHover} onSelect={onSelect} />
        <Answer variant="generic" rows={task.generic} focusId={null} onHover={onHover} onSelect={onSelect} />
      </Beat>
    </div>
  );
});

interface AnswerProps {
  variant: AnswerView;
  rows: readonly AnswerRow[];
  focusId: CaptureId | null;
  onHover: (id: CaptureId | null) => void;
  onSelect: (id: CaptureId) => void;
}

function Answer({ variant, rows, focusId, onHover, onSelect }: AnswerProps) {
  const K = BEATS.create;
  return (
    <ul className="sb-answer" data-variant={variant}>
      {rows.map((row, i) => (
        <Beat as="li" key={row.label} at="create" d={K.firstRow + i * K.rowGap} className="sb-row">
          <span className="sb-row-label">{row.label}</span>
          {row.parts.map((part) => (
            <Part key={part.text} part={part} focusId={focusId} onHover={onHover} onSelect={onSelect} />
          ))}
        </Beat>
      ))}
    </ul>
  );
}

function Part({
  part,
  focusId,
  onHover,
  onSelect,
}: {
  part: AnswerPart;
  focusId: CaptureId | null;
  onHover: (id: CaptureId | null) => void;
  onSelect: (id: CaptureId) => void;
}) {
  const from = part.from ?? [];
  const hit = focusId !== null && from.includes(focusId);
  const dim = focusId !== null && !hit;
  return (
    <>
      <span className="sb-part" data-hit={hit ? "true" : undefined} data-dim={dim ? "true" : undefined}>
        {part.text}
      </span>
      {from.map((id) => (
        <button
          key={id}
          type="button"
          className="sb-chip"
          data-kind="brain"
          data-hit={focusId === id ? "true" : undefined}
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
        <span className="sb-chip" data-kind="general">
          <GlobeIcon size={11} />
          General knowledge
        </span>
      ) : null}{" "}
    </>
  );
}
