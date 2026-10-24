import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3200);

/**
 * End-to-end checks for the landing page and its demo. Runs against a production build:
 *   npm run build && npm run test:e2e
 * Uses the installed Google Chrome (PW_CHANNEL=chrome by default); set PW_CHANNEL="" to use Playwright's own
 * Chromium after `npx playwright install chromium`.
 */
const channel = process.env.PW_CHANNEL ?? "chrome";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  fullyParallel: true,
  // The demo is timing-based; a few workers keep a busy machine from starving its timers.
  workers: 3,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    ...(channel ? { channel } : {}),
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
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
