import { memo } from "react";
import { PauseIcon, PlayIcon, ReplayIcon } from "@/components/icons";
import { cssVars } from "@/lib/css";
import { STAGES, TASKS, type StageId, type TaskId } from "./demo-data";

interface StepBarProps {
  current: StageId | null;
  onJump: (stage: StageId) => void;
  onTogglePlay: () => void;
  onReplay: () => void;
}

/** Progress through the six stages. Each step is a button that shows that stage in full. */
export const StepBar = memo(function StepBar({ current, onJump, onTogglePlay, onReplay }: StepBarProps) {
  return (
    <>
      <div className="sb-bar">
        <ol className="sb-steps" aria-label="Demo steps">
          {STAGES.map((stage, i) => (
            <li key={stage.id}>
              <button
                type="button"
                className="sb-step"
                data-step={stage.id}
                aria-current={current === stage.id ? "step" : undefined}
                aria-label={`${stage.label}, step ${i + 1} of ${STAGES.length}`}
                aria-describedby={`sb-now-${stage.id}`}
                onClick={() => onJump(stage.id)}
              >
                <span className="sb-track" aria-hidden="true">
                  <span className="sb-fill" data-step={stage.id} style={cssVars({ "--dur": stage.duration })} />
                </span>
                <span className="sb-step-label">{stage.label}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="sb-transport">
          {/* The visible label follows data-status in CSS, so it is right before and after hydration. */}
          <button type="button" className="sb-tbtn" data-toggle="" onClick={onTogglePlay}>
            <span data-when="playing">
              <PauseIcon size={14} />
              Pause
            </span>
            <span data-when="stopped">
              <PlayIcon size={14} />
              Play
            </span>
          </button>
          <button type="button" className="sb-tbtn" onClick={onReplay}>
            <ReplayIcon size={14} />
            Replay
          </button>
        </div>
      </div>
      {/* The current step written out: its name, its place in the six and what happens in it. All six share
          one cell, so the line keeps the height of the longest and nothing below it moves. */}
      <p className="sb-now" aria-hidden="true">
        {STAGES.map((stage, i) => (
          <span key={stage.id} data-now={stage.id}>
            <b>{stage.label}</b>
            <span className="sb-now-count">
              {" "}
              · {i + 1} of {STAGES.length} ·{" "}
            </span>
            <span id={`sb-now-${stage.id}`}>{stage.description}</span>
          </span>
        ))}
      </p>
    </>
  );
});

interface TaskBarProps {
  taskId: TaskId;
  onTask: (taskId: TaskId) => void;
}

export const TaskBar = memo(function TaskBar({ taskId, onTask }: TaskBarProps) {
  return (
    <div className="sb-tasks">
      <span className="sb-tasks-label" id="sb-tasks-label">
        Hand it a task
      </span>
      <div className="sb-task-chips" role="group" aria-labelledby="sb-tasks-label">
        {TASKS.map((task) => (
          <button
            key={task.id}
            type="button"
            className="sb-task"
            aria-pressed={taskId === task.id}
            onClick={() => onTask(task.id)}
          >
            {task.chip}
          </button>
        ))}
      </div>
      <span className="sb-note">Demo with sample fragments</span>
    </div>
  );
});
