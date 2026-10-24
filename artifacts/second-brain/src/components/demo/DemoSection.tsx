import { SecondBrainDemo } from "./SecondBrainDemo";

export function DemoSection() {
  // The demo applies motion preferences on mount. The old pre-hydration script
  // only served SSR and must not be rendered as a script in a client-only app.
  return <SecondBrainDemo />;
}
