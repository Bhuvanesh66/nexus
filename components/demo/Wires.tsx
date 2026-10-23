import { memo, useEffect, useState, type RefObject } from "react";
import { cssVars } from "@/lib/css";
import { BEATS, CONNECTIONS, NEW_CAPTURE_ID, type CaptureId, type Task } from "./demo-data";

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Geometry {
  w: number;
  h: number;
  cards: Partial<Record<CaptureId, Box>>;
  anchor: Box | null;
}

/** Position of `el` inside `root`, from layout offsets so in-flight transforms do not skew it. */
function boxWithin(el: HTMLElement, root: HTMLElement): Box {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

function measure(root: HTMLElement): Geometry {
  const cards: Partial<Record<CaptureId, Box>> = {};
  root.querySelectorAll<HTMLElement>("[data-capture-id]").forEach((el) => {
    cards[el.dataset.captureId as CaptureId] = boxWithin(el, root);
  });
  const anchorEl = root.querySelector<HTMLElement>("[data-task-anchor]");
  return { w: root.clientWidth, h: root.clientHeight, cards, anchor: anchorEl ? boxWithin(anchorEl, root) : null };
}

/** Measures the demo body whenever its parts change size (fonts landing, the new capture's slot opening, resizes). */
export function useGeometry(ref: RefObject<HTMLElement | null>): Geometry | null {
  const [geometry, setGeometry] = useState<Geometry | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let frame = 0;
    let last = "";
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = measure(root);
        const key = JSON.stringify(next);
        if (key === last) return;
        last = key;
        setGeometry(next);
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(root);
    root.querySelectorAll("[data-observe], [data-view], [data-task-anchor]").forEach((el) => observer.observe(el));
    document.fonts?.ready.then(update);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [ref]);

  return geometry;
}

const f = (n: number) => Math.round(n * 10) / 10;

/** A curve in the lane to the left of My Brain, from one capture to another. */
function arcPath(a: Box, b: Box): string {
  const y1 = a.y + a.h / 2;
  const y2 = b.y + b.h / 2;
  const bend = Math.min(26, 9 + Math.abs(y2 - y1) * 0.16);
  return `M${f(a.x)} ${f(y1)}C${f(a.x - bend)} ${f(y1)} ${f(b.x - bend)} ${f(y2)} ${f(b.x)} ${f(y2)}`;
}

/**
 * A wire from a recalled capture into the task. Beside the task (wide frames) it runs right, along its own
 * lane and in at the task's left edge; above the task (narrow frames) it runs down the lane on the right
 * of the captures and in at the task's top edge. Lanes are ordered so the wires never cross.
 */
function recallPath(card: Box, anchor: Box, i: number, n: number): string {
  const x1 = card.x + card.w;
  const y1 = card.y + card.h / 2;
  const r = 4;
  if (anchor.x >= x1 - 1) {
    const lane = x1 + Math.min(anchor.x - x1 - 5, 6 + i * 5);
    const y2 = anchor.y + 16 + i * 9;
    const dir = y2 < y1 ? -1 : 1;
    if (Math.abs(y2 - y1) < r * 2) return `M${f(x1)} ${f(y1)}L${f(anchor.x)} ${f(y2)}`;
    return [
      `M${f(x1)} ${f(y1)}`,
      `H${f(lane - r)}`,
      `Q${f(lane)} ${f(y1)} ${f(lane)} ${f(y1 + dir * r)}`,
      `V${f(y2 - dir * r)}`,
      `Q${f(lane)} ${f(y2)} ${f(lane + r)} ${f(y2)}`,
      `H${f(anchor.x)}`,
    ].join("");
  }
  const lane = x1 + 5 + (n - 1 - i) * 4;
  return [`M${f(x1)} ${f(y1)}`, `H${f(lane - r)}`, `Q${f(lane)} ${f(y1)} ${f(lane)} ${f(y1 + r)}`, `V${f(anchor.y)}`].join("");
}

interface WiresProps {
  geometry: Geometry | null;
  task: Task;
  focusId: CaptureId | null;
}

export const Wires = memo(function Wires({ geometry, task, focusId }: WiresProps) {
  if (!geometry) return null;
  const { cards, anchor } = geometry;
  const start = cards[NEW_CAPTURE_ID];
  const C = BEATS.connect;
  const R = BEATS.recall;
  const mark = (hit: boolean) => ({
    "data-hit": focusId && hit ? "true" : undefined,
    "data-dim": focusId && !hit ? "true" : undefined,
  });

  return (
    <svg
      className="sb-wires"
      width={geometry.w}
      height={geometry.h}
      viewBox={`0 0 ${geometry.w} ${geometry.h}`}
      aria-hidden="true"
      focusable="false"
    >
      {start ? (
        <g>
          {CONNECTIONS.map((link, i) => {
            const target = cards[link.to];
            if (!target) return null;
            const delay = C.arc + i * C.arcGap;
            const hit = focusId === NEW_CAPTURE_ID || focusId === link.to;
            return (
              <g key={link.to}>
                <path
                  className="sb-arc"
                  d={arcPath(start, target)}
                  pathLength={1}
                  data-at="connect"
                  {...mark(hit)}
                  style={cssVars({ "--d": delay, "--a": "sb-draw", "--t": "620ms", "--e": "var(--ease-in-out)" })}
                />
                <circle
                  className="sb-dot"
                  cx={f(target.x)}
                  cy={f(target.y + target.h / 2)}
                  r={3}
                  data-at="connect"
                  style={cssVars({ "--d": delay + 520, "--a": "sb-dot", "--t": "260ms" })}
                />
              </g>
            );
          })}
          <circle
            className="sb-dot"
            cx={f(start.x)}
            cy={f(start.y + start.h / 2)}
            r={3.5}
            data-at="connect"
            style={cssVars({ "--d": C.arc, "--a": "sb-dot", "--t": "260ms" })}
          />
        </g>
      ) : null}

      {anchor ? (
        <g className="sb-recall-group">
          {task.recalled.map((id, i) => {
            const card = cards[id];
            if (!card) return null;
            const d = recallPath(card, anchor, i, task.recalled.length);
            const delay = R.first + i * R.gap;
            return (
              <g key={id}>
                <path
                  className="sb-recall"
                  d={d}
                  pathLength={1}
                  data-at="recall"
                  {...mark(focusId === id)}
                  style={cssVars({ "--d": delay, "--a": "sb-draw", "--t": "520ms", "--e": "var(--ease-in-out)" })}
                />
                <path className="sb-pulse" d={d} pathLength={1} style={cssVars({ "--d": delay + 140 })} />
              </g>
            );
          })}
        </g>
      ) : null}
    </svg>
  );
});
