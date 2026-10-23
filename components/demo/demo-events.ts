/** Window event other parts of the page use to drive the demo (the hero's "Watch the 20-second demo"). */
export const DEMO_EVENT = "secondbrain:demo";

export interface DemoCommand {
  action: "replay";
}

declare global {
  interface Window {
    /** Set once the demo has applied the visitor's motion preference; read by the inline boot script's fallback. */
    __sbDemoReady?: boolean;
    /** Set once section reveals are being observed; read by the inline reveal fallback. */
    __sbRevealReady?: boolean;
  }
}
