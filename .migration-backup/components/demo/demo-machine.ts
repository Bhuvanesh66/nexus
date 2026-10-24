import {
  DEFAULT_TASK_ID,
  STAGE_BY_ID,
  STAGE_IDS,
  reachedThrough,
  stageIndex,
  type AppTab,
  type CaptureId,
  type StageId,
  type TaskId,
} from "./demo-data";

/**
 * idle     waiting at the start for the demo to scroll into view
 * playing  advancing through the stages on a timer
 * paused   stopped mid-stage; resuming continues the same stage
 * stepped  the visitor chose a stage; it is shown in full and holds
 * done     the run finished and rests on the result
 */
export type DemoStatus = "idle" | "playing" | "paused" | "stepped" | "done";
export type AnswerView = "brain" | "generic";

export interface DemoState {
  stage: StageId;
  status: DemoStatus;
  taskId: TaskId;
  /** 1 for the full play-through; shorter when a task chip replays the last three stages. */
  tempo: number;
  /** Time already spent in the current stage before the latest pause, in ms. */
  elapsed: number;
  answer: AnswerView;
  selected: CaptureId | null;
  hovered: CaptureId | null;
  /** Bumped on every fresh run so the animated subtree remounts and its CSS animations restart. */
  runId: number;
  /** Paused by the page (scrolled away, tab hidden) rather than by the visitor. */
  autoPaused: boolean;
  /** Announce stage changes to screen readers: only for runs the visitor started. */
  announce: boolean;
  /** False until the client has applied the visitor's motion preference. */
  booted: boolean;
}

export type DemoAction =
  | { type: "boot"; reducedMotion: boolean }
  | { type: "play"; by: "auto" | "user" }
  | { type: "pause"; elapsed: number; auto?: boolean }
  | { type: "resume-auto" }
  | { type: "replay" }
  | { type: "advance" }
  | { type: "jump"; stage: StageId }
  | { type: "task"; taskId: TaskId; reducedMotion: boolean }
  | { type: "answer"; answer: AnswerView }
  | { type: "select"; id: CaptureId }
  | { type: "hover"; id: CaptureId | null };

/** What the server renders: the finished result, which is also the reduced-motion and no-script view. */
export const initialDemoState: DemoState = {
  stage: "create",
  status: "done",
  taskId: DEFAULT_TASK_ID,
  tempo: 1,
  elapsed: 0,
  answer: "brain",
  selected: null,
  hovered: null,
  runId: 0,
  autoPaused: false,
  announce: false,
  booted: false,
};

const TASK_TEMPO = 0.75;

function freshRun(state: DemoState, stage: StageId, tempo: number): DemoState {
  return {
    ...state,
    stage,
    status: "playing",
    tempo,
    elapsed: 0,
    answer: "brain",
    runId: state.runId + 1,
    autoPaused: false,
    announce: true,
    booted: true,
  };
}

function nextStage(stage: StageId): StageId | null {
  return STAGE_IDS[stageIndex(stage) + 1] ?? null;
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "boot":
      if (state.booted) return state;
      return action.reducedMotion
        ? { ...state, booted: true }
        : { ...state, booted: true, stage: "capture", status: "idle", elapsed: 0 };

    case "play":
      // The page only ever starts a demo that is still waiting; anything else is the visitor's call.
      if (action.by === "auto" && state.status !== "idle") return state;
      switch (state.status) {
        case "idle":
          return { ...state, status: "playing", elapsed: 0, announce: action.by === "user", autoPaused: false, booted: true };
        case "paused":
          return { ...state, status: "playing", autoPaused: false, announce: state.announce || action.by === "user" };
        case "stepped": {
          const next = nextStage(state.stage);
          return next
            ? { ...state, stage: next, status: "playing", elapsed: 0, autoPaused: false, announce: true }
            : freshRun(state, "capture", 1);
        }
        case "done":
          return freshRun(state, "capture", 1);
        default:
          return state;
      }

    case "pause":
      if (state.status !== "playing") return state;
      return { ...state, status: "paused", elapsed: action.elapsed, autoPaused: Boolean(action.auto) };

    case "resume-auto":
      if (state.status !== "paused" || !state.autoPaused) return state;
      return { ...state, status: "playing", autoPaused: false };

    case "replay":
      return freshRun(state, "capture", 1);

    case "advance": {
      if (state.status !== "playing") return state;
      const next = nextStage(state.stage);
      return next ? { ...state, stage: next, elapsed: 0 } : { ...state, status: "done", elapsed: 0 };
    }

    case "jump":
      return { ...state, stage: action.stage, status: "stepped", elapsed: 0, autoPaused: false, announce: true, booted: true };

    case "task": {
      const base = { ...state, taskId: action.taskId, selected: null, hovered: null };
      if (action.reducedMotion) {
        return {
          ...base,
          stage: "create",
          status: "done",
          answer: "brain",
          runId: state.runId + 1,
          announce: true,
          autoPaused: false,
          booted: true,
        };
      }
      return freshRun(base, "ask", TASK_TEMPO);
    }

    case "answer":
      // Comparing is reading time: the run ends here, so the other answer swaps in at once instead of replaying.
      return state.answer === action.answer
        ? state
        : { ...state, answer: action.answer, status: state.stage === "create" ? "done" : state.status };

    case "select":
      return { ...state, selected: state.selected === action.id ? null : action.id };

    case "hover":
      return state.hovered === action.id ? state : { ...state, hovered: action.id };
  }
}

/** Space-separated list of the stages the visitor has reached; empty while idle. */
export function reachedList(state: Pick<DemoState, "stage" | "status">): string {
  return state.status === "idle" ? "" : reachedThrough(state.stage);
}

export function tabFor(stage: StageId): AppTab {
  return STAGE_BY_ID[stage].tab;
}

export function stageDuration(stage: StageId, tempo: number): number {
  return STAGE_BY_ID[stage].duration * tempo;
}
