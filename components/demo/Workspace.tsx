import { memo } from "react";
import { CheckIcon, GlobeIcon, LinkIcon, ReelIcon, VaultMark } from "@/components/icons";
import { cssVars } from "@/lib/css";
import { Beat } from "./Beat";
import {
  BEATS,
  CAPTURES,
  CAPTURE_BY_ID,
  CONNECTIONS,
  NEW_CAPTURE_INSIGHT as INSIGHT,
  type AnswerPart,
  type AppTab,
  type CaptureId,
  type StageId,
  type Task,
  type WorkItem,
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
            Drop a reel, link, voice note, or anything you just learned…
          </Beat>
          <Beat at="capture" d={B.link} a="sb-fade" className="sb-linktext">
            <ReelIcon size={14} />
            <span>{INSIGHT.link}</span>
          </Beat>
        </span>
        <span className="sb-btn" data-press="capture" style={cssVars({ "--p": B.send })}>
          Send
        </span>
      </div>

      <Beat as="article" at="capture" d={B.card} className="sb-capture" aria-label="New fragment">
        <div className="sb-process">
          <ProcessStep label="Absorbing" active={["capture", B.card]} done={["understand", 0]} />
          <ProcessStep label="Understanding" pending active={["understand", 0]} done={["connect", 0]} />
          <ProcessStep label="Connecting" pending active={["connect", 0]} done={["connect", C.done]} />
        </div>

        <div className="sb-insight">
          <Beat at="understand" d={U.title} className="sb-insight-title">
            {INSIGHT.title}
          </Beat>
          <Beat at="understand" d={U.title} className="sb-insight-meta">
            <ReelIcon size={13} />
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
          <p className="sb-connected-lead">
            <b>Absorbed.</b> Vault weight: {CAPTURES.length} fragments.
          </p>
          <p className="sb-connected-sub">Connected to {CONNECTIONS.length} you dropped before:</p>
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
            Hand off
          </span>
        </div>
      </div>

      <Beat as="div" at="recall" a="sb-fade" className="sb-status" data-variant="brain">
        <div className="sb-status-steps">
          <ProcessStep
            label="Pulling fragments"
            doneLabel="Fragments pulled"
            active={["recall", 0]}
            done={["recall", R.checked]}
          />
          <ProcessStep
            label="Finding what I can do"
            doneLabel="Ready to act"
            active={["recall", R.general]}
            done={["recall", R.ready]}
          />
        </div>
        <div className="sb-status-sources">
          <span className="sb-fragments">
            <VaultMark size={12} />
            <span className="sb-roll" aria-hidden="true">
              <span className="sb-roll-strip" style={cssVars({ "--n": used, "--d": R.first })}>
                {Array.from({ length: used + 1 }, (_, n) => (
                  <span key={n}>{n}</span>
                ))}
              </span>
            </span>
            <span className="sr-only">{used}</span> fragments used
          </span>
          <Beat at="recall" d={R.general} className="sb-general">
            <GlobeIcon size={12} />
            General knowledge: <b>{task.generalTopic}</b>
          </Beat>
        </div>
      </Beat>
      <div className="sb-status" data-variant="generic">
        <GlobeIcon size={13} />
        <span className="sb-generic-note">General knowledge only. 0 fragments used.</span>
      </div>

      {/* Surface offers the work and Deliver does it. Both share one cell, so the view keeps its height. */}
      <div className="sb-stage">
        <Options task={task} />
        <Work task={task} focusId={focusId} answer={answer} onAnswer={onAnswer} onHover={onHover} onSelect={onSelect} />
      </div>
    </div>
  );
});

/** What Nexus offers to do with the fragments it pulled. The first offer is taken. */
function Options({ task }: { task: Task }) {
  const R = BEATS.recall;
  return (
    <Beat as="div" out="create" className="sb-options-frame">
      <Beat as="div" at="recall" d={R.options} className="sb-options">
        <p className="sb-options-lead">Here’s what I can do for you:</p>
        <ul className="sb-option-list">
          {task.options.map((option, i) => (
            <Beat as="li" key={option} at="recall" d={R.options + 100 + i * R.optionGap} className="sb-option">
              {i === 0 ? <Beat at="recall" d={R.pick} a="sb-fade" className="sb-option-ring" aria-hidden="true" /> : null}
              <span
                className="sb-option-text"
                data-press={i === 0 ? "recall" : undefined}
                style={i === 0 ? cssVars({ "--p": R.pick }) : undefined}
              >
                {option}
              </span>
              {i === 0 ? (
                <Beat at="recall" d={R.pick} a="sb-fade" className="sb-option-pick">
                  <CheckIcon size={12} />
                  Doing this
                </Beat>
              ) : null}
            </Beat>
          ))}
        </ul>
      </Beat>
    </Beat>
  );
}

interface WorkProps {
  task: Task;
  focusId: CaptureId | null;
  answer: AnswerView;
  onAnswer: (answer: AnswerView) => void;
  onHover: (id: CaptureId | null) => void;
  onSelect: (id: CaptureId) => void;
}

/** The work itself: each piece is made, one is shown for review, you give the go-ahead, and it is finished. */
function Work({ task, focusId, answer, onAnswer, onHover, onSelect }: WorkProps) {
  const K = BEATS.create;
  return (
    <Beat as="div" at="create" className="sb-output" role="group" aria-label={task.title}>
      <div className="sb-output-head">
        <p className="sb-output-title">{task.title}</p>
        <Beat at="create" d={K.compare} className="sb-compare" role="group" aria-label="Compare with generic AI">
          <button type="button" aria-pressed={answer === "brain"} onClick={() => onAnswer("brain")}>
            With your Vault
          </button>
          <button type="button" aria-pressed={answer === "generic"} onClick={() => onAnswer("generic")}>
            Generic AI
          </button>
        </Beat>
      </div>

      <div className="sb-deliver" data-variant="brain">
        <ul className="sb-items">
          {task.items.map((item, i) => (
            <li key={item.name} className="sb-item">
              <span className="sb-item-name">{item.name}</span>
              <span className="sb-item-detail">{item.detail}</span>
              <ItemStatus item={item} i={i} verbs={task.verbs} />
            </li>
          ))}
        </ul>
        <Beat as="div" at="create" d={K.preview} className="sb-preview">
          <p className="sb-preview-label">{task.preview.label}</p>
          <p className="sb-preview-text">
            {task.preview.parts.map((part) => (
              <Part key={part.text} part={part} focusId={focusId} onHover={onHover} onSelect={onSelect} />
            ))}
          </p>
        </Beat>
        <DeliverLine task={task} />
      </div>

      <div className="sb-deliver" data-variant="generic">
        <div className="sb-preview">
          <p className="sb-preview-label">{task.preview.label}</p>
          <p className="sb-preview-text">
            {task.generic.parts.map((part) => (
              <Part key={part.text} part={part} focusId={null} onHover={onHover} onSelect={onSelect} />
            ))}
          </p>
        </div>
        <p className="sb-generic-foot">
          <GlobeIcon size={13} />
          {task.generic.foot}
        </p>
      </div>
    </Beat>
  );
}

/** One piece of work moving through queued, making, made, sending and done. */
function ItemStatus({ item, i, verbs }: { item: WorkItem; i: number; verbs: Task["verbs"] }) {
  const K = BEATS.create;
  const making = K.making + i * K.itemGap;
  const made = K.made + i * K.doneGap;
  const sending = K.sending + i * K.itemGap;
  const sent = K.sent + i * K.doneGap;
  return (
    <span className="sb-item-status">
      <Beat out="create" o={making} className="sb-tag" data-state="queued">
        Queued
      </Beat>
      <Beat at="create" d={making} a="sb-fade">
        <Beat out="create" o={made} className="sb-tag" data-state="working">
          {verbs.making}…
        </Beat>
      </Beat>
      <Beat at="create" d={made + HANDOVER} a="sb-fade">
        <Beat out="create" o={sending} className="sb-tag" data-state="made">
          {verbs.made}
        </Beat>
      </Beat>
      <Beat at="create" d={sending + HANDOVER} a="sb-fade">
        <Beat out="create" o={sent} className="sb-tag" data-state="working">
          {verbs.sending}…
        </Beat>
      </Beat>
      <Beat at="create" d={sent + HANDOVER} a="sb-fade" className="sb-tag" data-state="done">
        <CheckIcon size={11} />
        {item.done}
      </Beat>
    </span>
  );
}

/** The run in one line: making, then the one check-in with you, then sending, then done. */
function DeliverLine({ task }: { task: Task }) {
  const K = BEATS.create;
  return (
    <div className="sb-deliver-line">
      <Beat out="create" o={K.review} className="sb-line" data-state="working">
        {task.lines.making}
      </Beat>
      <Beat at="create" d={K.review + HANDOVER} a="sb-fade">
        <Beat out="create" o={K.sending} className="sb-line sb-review">
          <span>{task.lines.review}</span>
          <span className="sb-review-actions">
            <span className="sb-btn sb-btn-quiet">Refine</span>
            <span className="sb-btn sb-btn-go" data-press="create" style={cssVars({ "--p": K.approve })}>
              Go ahead
            </span>
          </span>
        </Beat>
      </Beat>
      <Beat at="create" d={K.sending + HANDOVER} a="sb-fade">
        <Beat out="create" o={K.done} className="sb-line" data-state="working">
          {task.lines.sending}
        </Beat>
      </Beat>
      <Beat at="create" d={K.done + HANDOVER} a="sb-fade" className="sb-line" data-state="done">
        <CheckIcon size={13} />
        {task.lines.done}
      </Beat>
    </div>
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
        <span className="sb-chip" data-kind="general">
          <GlobeIcon size={11} />
          General knowledge
        </span>
      ) : null}{" "}
    </>
  );
}
