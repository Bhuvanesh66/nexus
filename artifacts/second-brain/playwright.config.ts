import { defineConfig, devices } from "@playwright/test";
import { execFileSync } from "node:child_process";

/**
 * End-to-end checks for the landing page and its demo. Runs against the app already served through the shared
 * proxy (no webServer is started here):
 *   pnpm --filter @workspace/second-brain run test:e2e
 * Override the target with PW_BASE_URL. Uses Playwright's own Chromium by default; set PW_CHANNEL=chrome to use
 * an installed Google Chrome.
 */
const baseURL = process.env.PW_BASE_URL ?? "http://localhost:80";
const channel = process.env.PW_CHANNEL ?? "";
let executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
if (!executablePath && !channel) {
  try {
    // Replit's Nix Chromium includes its system libraries; downloaded builds do not.
    executablePath = execFileSync("which", ["chromium"], { encoding: "utf8" }).trim();
  } catch {
    // Other environments can use Playwright's installed Chromium.
  }
}

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  fullyParallel: true,
  // The demo is timing-based; a few workers keep a busy machine from starving its timers.
  workers: 3,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    ...(channel ? { channel } : {}),
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        userAgent: devices["Pixel 7"].userAgent,
      },
    },
    { name: "reduced-motion", use: { viewport: { width: 1440, height: 900 }, contextOptions: { reducedMotion: "reduce" } } },
  ],
});
