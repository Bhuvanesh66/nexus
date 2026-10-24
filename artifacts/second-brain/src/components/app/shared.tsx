
import { useEffect, useState } from "react";
import { CheckIcon } from "@/components/icons";
import type { ApiError } from "@/lib/vault";
import styles from "./app.module.css";

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: ApiError & Record<string, unknown> };

/** fetch for the app's own API: JSON in and out, human-readable errors, and a signed-out redirect. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<Result<T>> {
  try {
    const res = await fetch(path, {
      ...init,
      headers: init.body ? { "content-type": "application/json", ...init.headers } : init.headers,
    });
    if (res.status === 204) return { ok: true, data: null as T };
    const body = await res.json().catch(() => null);
    if (res.ok) return { ok: true, data: body as T };
    // A full page load on purpose: the session is gone, so no client state should survive.
    
    if (res.status === 401) window.location.assign("/sign-in?error=session");
    return {
      ok: false,
      status: res.status,
      error: body?.message ? body : { code: "unknown", message: "Something went wrong. Try again in a moment." },
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, status: 0, error: { code: "cancelled", message: "Cancelled." } };
    }
    return {
      ok: false,
      status: 0,
      error: { code: "network", message: "Nexus couldn’t reach the server. Check your connection and try again." },
    };
  }
}

/** Which step of a running pipeline to show, advancing on a schedule while the request is in flight. */
export function useStage(running: boolean, delays: number[]) {
  const [stage, setStage] = useState(0);
  const key = delays.join(",");
  useEffect(() => {
    if (!running) return;
    const timers = key.split(",").map((d, i) => window.setTimeout(() => setStage(i), Number(d)));
    return () => timers.forEach(clearTimeout);
  }, [running, key]);
  return running ? stage : 0;
}

/** True once the request has run longer than `after` milliseconds. */
export function useSlow(running: boolean, after: number) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setSlow(true), after);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [running, after]);
  return running && slow;
}

export function Stages({ steps, active, label }: { steps: string[]; active: number; label: string }) {
  return (
    <ol className={styles.stages} aria-label={label}>
      {steps.map((step, i) => {
        const state = i < active ? "done" : i === active ? "active" : "todo";
        return (
          <li key={step} data-state={state} aria-current={state === "active" ? "step" : undefined}>
            <span className={styles.stageDot} aria-hidden="true">
              {state === "done" ? <CheckIcon size={12} /> : null}
            </span>
            {step}
            {state === "active" ? "…" : null}
          </li>
        );
      })}
    </ol>
  );
}
