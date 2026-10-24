
import { useCallback, useEffect, useEffectEvent, useReducer, useRef, type CSSProperties } from "react";
import { NexusMark, PlayIcon } from "@/components/icons";
import { BrainColumn } from "./BrainColumn";
import { StepBar, TaskBar } from "./DemoControls";
import { TASK_BY_ID, narrationFor, type AppTab, type CaptureId, type StageId, type Task, type TaskId } from "./demo-data";
import { DEMO_EVENT, type DemoCommand } from "./demo-events";
import {
  demoReducer,
  initialDemoState,
  reachedList,
  stageDuration,
  tabFor,
  type AnswerView,
} from "./demo-machine";
import { AskView, DumpView } from "./Workspace";
import { useGeometry, Wires } from "./Wires";
import "./demo.css";

/** Share of the demo that must be on screen before it plays (and below which it pauses itself). */
const VISIBLE_RATIO = 0.35;
/** Lets the headline land before the demo starts moving. */
const AUTOPLAY_DELAY = 700;

export function SecondBrainDemo() {
  const [state, dispatch] = useReducer(demoReducer, initialDemoState);
  const rootRef = useRef<HTMLDivElement>(null);
  const segmentStartRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const inViewRef = useRef(false);
  const autoplayTimerRef = useRef(0);

  const task = TASK_BY_ID[state.taskId];
  const tab = tabFor(state.stage);
  const duration = stageDuration(state.stage, state.tempo);
  const focusId = state.hovered ?? state.selected;
  const announcement = state.announce && state.status !== "idle" ? narrationFor(state.stage, task) : "";

  // One timer for the current stage. Pausing records how far into the stage the run got.
  useEffect(() => {
    if (state.status !== "playing") return;
    segmentStartRef.current = performance.now();
    const id = window.setTimeout(() => dispatch({ type: "advance" }), Math.max(0, duration - state.elapsed));
    return () => window.clearTimeout(id);
  }, [state.status, state.stage, state.runId, state.elapsed, duration]);

  const pause = (auto: boolean) => {
    const elapsed = state.elapsed + (performance.now() - segmentStartRef.current);
    dispatch({ type: "pause", elapsed: Math.min(duration, elapsed), auto });
  };

  const onViewChange = useEffectEvent((visible: boolean) => {
    inViewRef.current = visible;
    let status = state.status;
    if (!state.booted) {
      // First observation after hydration: apply the motion preference the server could not know.
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      reducedMotionRef.current = reduced;
      dispatch({ type: "boot", reducedMotion: reduced });
      window.__sbDemoReady = true;
      status = reduced ? "done" : "idle";
    }
    window.clearTimeout(autoplayTimerRef.current);
    if (!visible) {
      if (status === "playing") pause(true);
      return;
    }
    if (status === "idle") {
      autoplayTimerRef.current = window.setTimeout(() => dispatch({ type: "play", by: "auto" }), AUTOPLAY_DELAY);
    } else if (status === "paused" && state.autoPaused) {
      dispatch({ type: "resume-auto" });
    }
  });

  const onPageVisibility = useEffectEvent(() => {
    if (document.hidden) {
      if (state.status === "playing") pause(true);
    } else if (inViewRef.current && state.status === "paused" && state.autoPaused) {
      dispatch({ type: "resume-auto" });
    }
  });

  const onCommand = useEffectEvent((event: Event) => {
    const command = (event as CustomEvent<DemoCommand>).detail;
    if (command?.action !== "replay") return;
    dispatch({ type: "replay" });
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      root.scrollIntoView({ behavior: reducedMotionRef.current ? "auto" : "smooth", block: "start" });
    }
    root.focus({ preventScroll: true });
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches;
    };
    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            ([entry]) => onViewChange(entry.isIntersecting && entry.intersectionRatio >= VISIBLE_RATIO),
            { threshold: [0, VISIBLE_RATIO, 0.7] },
          )
        : null;
    observer?.observe(root);
    document.addEventListener("visibilitychange", onPageVisibility);
    window.addEventListener(DEMO_EVENT, onCommand);
    motion.addEventListener("change", onMotionChange);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onPageVisibility);
      window.removeEventListener(DEMO_EVENT, onCommand);
      motion.removeEventListener("change", onMotionChange);
      window.clearTimeout(autoplayTimerRef.current);
    };
  }, []);

  const onTogglePlay = () => {
    window.clearTimeout(autoplayTimerRef.current);
    if (state.status === "playing") pause(false);
    else dispatch({ type: "play", by: "user" });
  };
  const onPlay = useCallback(() => {
    window.clearTimeout(autoplayTimerRef.current);
    dispatch({ type: "play", by: "user" });
  }, []);
  const onReplay = useCallback(() => {
    window.clearTimeout(autoplayTimerRef.current);
    dispatch({ type: "replay" });
  }, []);
  const onJump = useCallback((stage: StageId) => {
    window.clearTimeout(autoplayTimerRef.current);
    dispatch({ type: "jump", stage });
  }, []);
  const onTask = useCallback((taskId: TaskId) => {
    window.clearTimeout(autoplayTimerRef.current);
    dispatch({ type: "task", taskId, reducedMotion: reducedMotionRef.current });
  }, []);
  const onAnswer = useCallback((answer: AnswerView) => dispatch({ type: "answer", answer }), []);
  const onHover = useCallback((id: CaptureId | null) => dispatch({ type: "hover", id }), []);
  const onSelect = useCallback((id: CaptureId) => dispatch({ type: "select", id }), []);

  return (
    <div
      ref={rootRef}
      id="demo"
      role="region"
      aria-label="Nexus in action: interactive demo with sample fragments"
      tabIndex={-1}
      className="sb-demo"
      data-demo=""
      data-stage={state.stage}
      data-status={state.status}
      data-reached={reachedList(state)}
      data-tab={tab}
      data-answer={state.answer}
      style={{ "--tempo": state.tempo } as CSSProperties}
      // An inline script swaps these attributes to the start of the story before hydration (see DemoSection).
      suppressHydrationWarning
    >
      <StepBar
        current={state.status === "idle" ? null : state.stage}
        onJump={onJump}
        onTogglePlay={onTogglePlay}
        onReplay={onReplay}
      />
      <AppFragment
        key={state.runId}
        tab={tab}
        task={task}
        focusId={focusId}
        selected={state.selected}
        answer={state.answer}
        onAnswer={onAnswer}
        onHover={onHover}
        onSelect={onSelect}
        onPlay={onPlay}
      />
      <TaskBar taskId={state.taskId} onTask={onTask} />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <p id="sb-source-hint" className="sr-only">
        Highlights where this fragment is used in the answer.
      </p>
    </div>
  );
}

interface AppFragmentProps {
  tab: AppTab;
  task: Task;
  focusId: CaptureId | null;
  selected: CaptureId | null;
  answer: AnswerView;
  onAnswer: (answer: AnswerView) => void;
  onHover: (id: CaptureId | null) => void;
  onSelect: (id: CaptureId) => void;
  onPlay: () => void;
}

/** The product itself, as the dashboard will look: Drop, Hand off and Your Vault. Remounted for every fresh run. */
function AppFragment({ tab, task, focusId, selected, answer, onAnswer, onHover, onSelect, onPlay }: AppFragmentProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const geometry = useGeometry(bodyRef);
  return (
    <div className="sb-app" data-ui="">
      <div className="sb-appbar" aria-hidden="true">
        <span className="sb-appname" translate="no">
          <NexusMark size={16} />
          Nexus
        </span>
        <span className="sb-tabs">
          <span className="sb-tab" data-tab-id="dump">
            Drop
          </span>
          <span className="sb-tab" data-tab-id="ask">
            Hand off
          </span>
          <span className="sb-tab" data-tab-id="brain">
            Your Vault
          </span>
        </span>
        <span className="sb-account">Demo account</span>
      </div>
      <div className="sb-body" ref={bodyRef}>
        <BrainColumn task={task} focusId={focusId} selected={selected} onHover={onHover} onSelect={onSelect} />
        <div className="sb-work">
          <DumpView tab={tab} />
          <AskView
            tab={tab}
            task={task}
            focusId={focusId}
            answer={answer}
            onAnswer={onAnswer}
            onHover={onHover}
            onSelect={onSelect}
          />
          {/* Shown only while the demo waits to start (data-status="idle"), in the space the story will fill. */}
          <div className="sb-idle">
            <p>Watch a reel become three sent applications in about 20 seconds.</p>
            <button type="button" className="sb-idle-play" onClick={onPlay}>
              <PlayIcon size={14} />
              See it live
            </button>
          </div>
        </div>
        <Wires geometry={geometry} task={task} focusId={focusId} />
      </div>
    </div>
  );
}
