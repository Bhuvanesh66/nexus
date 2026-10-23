"use client";

import { PlayIcon } from "@/components/icons";
import { DEMO_EVENT, type DemoCommand } from "@/components/demo/demo-events";

/** Jumps to the demo and plays it from the start. Without script it is a plain link to the demo. */
export function WatchDemoLink({ className, iconClassName }: { className?: string; iconClassName?: string }) {
  return (
    <a
      href="#demo"
      className={className}
      onClick={(event) => {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent<DemoCommand>(DEMO_EVENT, { detail: { action: "replay" } }));
      }}
    >
      <span className={iconClassName} aria-hidden="true">
        <PlayIcon size={14} />
      </span>
      See a fragment become work (20s)
    </a>
  );
}
