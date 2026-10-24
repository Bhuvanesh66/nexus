import { reachedThrough } from "./demo-data";
import { SecondBrainDemo } from "./SecondBrainDemo";

/**
 * The server renders the demo's finished result: that is what visitors without script and visitors who
 * prefer reduced motion see. For everyone else this script, which runs as soon as the demo's markup has
 * been parsed, rewinds the demo to the start of the story before the first paint, so it can play from the
 * beginning without a flash of the result. If the app never hydrates, it puts the result back.
 */
const BOOT_SCRIPT = `(function () {
  try {
    var demo = document.getElementById("demo");
    if (!demo || !window.matchMedia || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var set = function (stage, status, reached, tab) {
      demo.setAttribute("data-stage", stage);
      demo.setAttribute("data-status", status);
      demo.setAttribute("data-reached", reached);
      demo.setAttribute("data-tab", tab);
    };
    set("capture", "idle", "", "dump");
    setTimeout(function () {
      if (!window.__sbDemoReady) set("create", "done", ${JSON.stringify(reachedThrough("create"))}, "ask");
    }, 8000);
  } catch (e) {}
})();`;

export function DemoSection() {
  return (
    <>
      <SecondBrainDemo />
      <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
    </>
  );
}
