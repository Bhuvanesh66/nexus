import { expect, test, type Page } from "@playwright/test";

const demo = (page: Page) => page.locator("#demo");

/** Collects console errors, page errors and failed requests for the lifetime of the page. */
function watchForProblems(page: Page) {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => problems.push(`requestfailed: ${request.url()}`));
  return problems;
}

async function startDemo(page: Page) {
  await page.goto("/");
  await demo(page).scrollIntoViewIfNeeded();
}

test.describe("landing page", () => {
  test("states the pitch, offers one primary action and logs no errors", async ({ page }) => {
    const problems = watchForProblems(page);
    await page.goto("/");
    await expect(page).toHaveTitle("Nexus — Beyond memory.");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^Beyond\s*memory\.$/);
    await expect(page.getByText("Nexus is where everything you’ve learned meets the task you’re doing")).toBeVisible();
    const cta = page.getByRole("link", { name: "Try Nexus free" }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/sign-in");
    await expect(page.getByText("No credit card. Free during beta.")).toBeVisible();
    await expect(page.getByRole("list", { name: "What you can drop" }).getByRole("listitem")).toHaveText([
      /^Instagram reels/,
      /^YouTube Shorts/,
      /^PDFs/,
      /^Posts on X/,
    ]);
    await page.waitForTimeout(2500);
    expect(problems).toEqual([]);
  });

  test("uses the Nexus name and vocabulary throughout", async ({ page }) => {
    await page.goto("/");
    const text = await page.locator("body").innerText();
    for (const old of ["Second Brain", "My Brain", "memories used", "Try Free with Google"]) {
      expect(text, `no “${old}” left on the page`).not.toContain(old);
    }
    // Read from the markup: the phone header shows only "Sign in" by design.
    await expect(page.locator('nav[aria-label="Primary"] a')).toHaveText([
      "See it work",
      "Why Nexus",
      "Sign in",
    ]);
  });

  test("proves the shift with three sourced figures, then the eras and the close", async ({ page }) => {
    await page.goto("/");
    const whyNow = page.locator("#why-now");
    await expect(whyNow.getByRole("heading", { level: 2 })).toHaveText("The world is learning in fragments.");
    await expect(whyNow.getByText("Nobody built the layer for that.")).toBeAttached();
    await expect(whyNow.getByRole("listitem")).toHaveCount(3);
    await expect(whyNow.getByText(/^Source: /)).toHaveText([
      "Source: Indeed, 2026",
      "Source: Kalaari Capital, Creator Economy Report",
      "Source: BCG, From Content to Commerce, 2025",
    ]);
    await expect(whyNow.getByText("Until now.")).toBeAttached();

    const tagline = page.getByRole("region", { name: "Stop collecting. Start remembering. Start doing." });
    await expect(tagline.getByRole("heading", { level: 2 })).toHaveText([
      "Stop collecting.",
      "Start remembering.",
      "Start doing.",
    ]);

    const eras = page.locator("#eras");
    await expect(eras.getByRole("heading", { level: 3 })).toHaveText([
      "Era 1: The Mind",
      "Era 2: The Shelf",
      "Era 3: Nexus",
    ]);
    await expect(eras.getByText("5,000 years.")).toBeAttached();

    const footer = page.locator("footer");
    await expect(footer.getByRole("heading", { name: "The layer that comes after notebooks." })).toBeAttached();
    await expect(footer.getByRole("link", { name: "Try Nexus free" })).toHaveAttribute("href", "/sign-in");
    await expect(footer).toContainText("© 2026 Nexus. Built for Airtribe AI Builders Day ’26 — October 24, Bengaluru.");
  });

  test("never scrolls sideways", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("keeps the headline, the action and the demo above the fold on a desktop", async ({ page }, info) => {
    test.skip(info.project.name === "mobile", "the phone stacks the demo below the copy by design");
    await page.goto("/");
    const fold = page.viewportSize()!.height;
    for (const locator of [
      page.getByRole("heading", { level: 1 }),
      page.getByRole("link", { name: "Try Nexus free" }).first(),
      page.locator("#demo [data-ui]"),
    ]) {
      const box = await locator.boundingBox();
      expect(box, "element is rendered").not.toBeNull();
      expect(box!.y).toBeLessThan(fold);
      expect(box!.y + box!.height).toBeLessThanOrEqual(fold);
    }
  });

  test("the primary action leads to the honest sign-in placeholder", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Try Nexus free" }).first().click();
    await expect(page).toHaveURL(/\/sign-in$/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sign-in isn’t connected yet");
  });

  test("keyboard focus reaches the primary action with a visible ring", async ({ page }, info) => {
    test.skip(info.project.name === "mobile", "no hardware keyboard on the phone profile");
    await page.goto("/");
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      const name = await page.evaluate(() => document.activeElement?.textContent?.trim());
      if (name === "Try Nexus free") break;
    }
    const focused = page.locator(":focus");
    await expect(focused).toHaveText("Try Nexus free");
    const outline = await focused.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe("none");
  });

  test("the comparison lights the words a saved note produced", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("#different");
    await section.scrollIntoViewIfNeeded();
    await section.getByRole("button", { name: /^Our October numbers/ }).click();
    await expect(section.locator('p span[data-hit="true"]', { hasText: "1,240 paying learners" })).toBeVisible();
    await expect(section.getByText("Sent to Northstar, Foundry 100 and Sprint Labs.")).toBeVisible();
  });
});

test.describe("demo", () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name === "reduced-motion", "covered by the reduced-motion block");
  });

  test("plays drop to deliver on its own and rests on the result", async ({ page }) => {
    test.setTimeout(60_000);
    await startDemo(page);
    await expect(demo(page)).toHaveAttribute("data-status", "playing", { timeout: 5_000 });
    await expect(demo(page)).toHaveAttribute("data-stage", "connect", { timeout: 12_000 });
    await expect(demo(page)).toHaveAttribute("data-stage", "recall", { timeout: 8_000 });
    await expect(demo(page)).toHaveAttribute("data-status", "done", { timeout: 15_000 });
    await expect(demo(page).getByText("Here. Done. 3 applications sent.")).toBeVisible();
    await page.waitForTimeout(2_000);
    await expect(demo(page), "it does not restart while someone reads").toHaveAttribute("data-status", "done");
  });

  test("pause holds the current stage and play continues it", async ({ page }) => {
    await startDemo(page);
    await expect(demo(page)).toHaveAttribute("data-status", "playing", { timeout: 5_000 });
    await demo(page).getByRole("button", { name: "Pause", exact: true }).click();
    await expect(demo(page)).toHaveAttribute("data-status", "paused");
    const stage = await demo(page).getAttribute("data-stage");
    await page.waitForTimeout(4_000);
    await expect(demo(page)).toHaveAttribute("data-stage", stage!);
    await demo(page).getByRole("button", { name: "Play", exact: true }).click();
    await expect(demo(page)).toHaveAttribute("data-status", "playing");
  });

  test("replay starts the story again", async ({ page }) => {
    await startDemo(page);
    await demo(page).getByRole("button", { name: /Deliver, step 6 of 6/ }).click();
    await expect(demo(page)).toHaveAttribute("data-stage", "create");
    await demo(page).getByRole("button", { name: "Replay" }).click();
    await expect(demo(page)).toHaveAttribute("data-stage", "capture");
    await expect(demo(page)).toHaveAttribute("data-status", "playing");
  });

  test("each step button shows its stage and says what happens in it", async ({ page }) => {
    await startDemo(page);
    const surface = demo(page).getByRole("button", { name: /Surface, step 5 of 6/ });
    await surface.click();
    await expect(demo(page)).toHaveAttribute("data-stage", "recall");
    await expect(demo(page)).toHaveAttribute("data-status", "stepped");
    await expect(surface).toHaveAttribute("aria-current", "step");
    const description = "Nexus pulls every fragment that matters, then offers what it can do for you.";
    await expect(surface).toHaveAccessibleDescription(description);
    const line = demo(page).locator('.sb-now > [data-now="recall"]');
    await expect(line).toBeVisible();
    await expect(line).toHaveText(`Surface · 5 of 6 · ${description}`);
    await expect(demo(page).locator('[data-recalled="true"]')).toHaveCount(4);
  });

  test("surface offers the work and deliver checks in once before sending", async ({ page }) => {
    test.setTimeout(45_000);
    await startDemo(page);
    await demo(page).getByRole("button", { name: /Surface, step 5 of 6/ }).click();
    const chosen = demo(page).locator(".sb-option", { hasText: "Apply to all 3 accelerators from the reel" });
    await expect(chosen.getByText("Doing this")).toBeVisible({ timeout: 5_000 });
    await expect(demo(page).locator(".sb-option")).toHaveCount(3);

    await demo(page).getByRole("button", { name: /Deliver, step 6 of 6/ }).click();
    const output = demo(page).locator('.sb-deliver[data-variant="brain"]');
    await expect(output.getByText("3 drafts ready. Need any refining?")).toBeVisible({ timeout: 5_000 });
    await expect(output.getByText("Go ahead")).toBeVisible();
    await expect(output.getByText("Sending applications…")).toBeVisible({ timeout: 5_000 });
    await expect(output.getByText("Here. Done. 3 applications sent.")).toBeVisible({ timeout: 5_000 });
    await expect(output.locator('.sb-tag[data-state="done"]')).toHaveText(["Sent", "Sent", "Sent"]);
  });

  test("task chips change the task, the surfaced fragments and the answer", async ({ page }) => {
    test.setTimeout(60_000);
    await startDemo(page);
    const chip = demo(page).getByRole("button", { name: "Draft an email" });
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    await expect(demo(page)).toHaveAttribute("data-stage", "ask");
    await expect(
      demo(page).locator("[data-task-anchor]").getByText("Ask my mentor Priya for a warm intro to Northstar."),
    ).toBeVisible();
    await expect(demo(page).locator('[data-recalled="true"]')).toHaveCount(3);
    await expect(demo(page)).toHaveAttribute("data-status", "done", { timeout: 15_000 });
    await expect(demo(page).locator(".sb-output-title")).toHaveText("Intro email");
    await expect(demo(page).getByText("Here. Done. Email sent to Priya.")).toBeVisible();

    await demo(page).getByRole("button", { name: "Prep for a meeting" }).click();
    await expect(demo(page).locator('[data-recalled="true"]')).toHaveCount(4);
    await expect(demo(page).locator('[data-capture-id="partners"]')).toHaveAttribute("data-recalled", "true");
  });

  test("choosing a source lights the sentences it produced", async ({ page }) => {
    await startDemo(page);
    await demo(page).getByRole("button", { name: /Deliver, step 6 of 6/ }).click();
    const preview = demo(page).locator('.sb-deliver[data-variant="brain"] .sb-preview');
    await expect(preview.getByText("Northstar asks: What do you do, and what traction do you have?")).toBeVisible({
      timeout: 5_000,
    });
    const card = demo(page).getByRole("button", { name: /^Our October numbers/ });
    await card.click();
    await expect(card).toHaveAttribute("aria-pressed", "true");
    const lit = preview.locator('.sb-part[data-hit="true"]');
    await expect(lit).toHaveCount(1);
    await expect(lit).toHaveText("1,240 paying learners, growing 18% a month.");
  });

  test("the generic answer can be compared with the Vault's", async ({ page }) => {
    await startDemo(page);
    await demo(page).getByRole("button", { name: /Deliver, step 6 of 6/ }).click();
    const generic = demo(page).getByRole("button", { name: "Generic AI" });
    await expect(generic).toBeVisible({ timeout: 10_000 });
    await generic.click();
    await expect(demo(page)).toHaveAttribute("data-answer", "generic");
    await expect(demo(page).getByText(/^We are an innovative edtech startup leveraging AI/)).toBeVisible();
    await expect(demo(page).getByText("General knowledge only. 0 fragments used.")).toBeVisible();
    await expect(demo(page).getByText(/^Generic AI stops at the answer/)).toBeVisible();
    await expect(demo(page).locator(".sb-items"), "generic AI makes and sends nothing").toBeHidden();
  });

  test("“See a fragment become work” replays the demo and moves focus to it", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "See a fragment become work (20s)" }).click();
    await expect(demo(page)).toBeFocused();
    await expect(demo(page)).toHaveAttribute("data-stage", "capture");
    await expect(demo(page)).toHaveAttribute("data-status", "playing");
  });
});

test.describe("reduced motion", () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== "reduced-motion", "runs only with reduced motion requested");
  });

  test("shows the finished story at once and never autoplays", async ({ page }) => {
    await page.goto("/");
    await expect(demo(page)).toHaveAttribute("data-stage", "create");
    await expect(demo(page)).toHaveAttribute("data-status", "done");
    await expect(demo(page).getByText("Here. Done. 3 applications sent.")).toBeVisible();
    await expect(demo(page).locator('[data-view="dump"]'), "the Drop tab is not the one on show").toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await page.waitForTimeout(3_000);
    await expect(demo(page)).toHaveAttribute("data-status", "done");
  });

  test("a task chip swaps straight to that task's result", async ({ page }) => {
    await page.goto("/");
    await demo(page).getByRole("button", { name: "Prep for a meeting" }).click();
    await expect(demo(page)).toHaveAttribute("data-stage", "create");
    await expect(demo(page).locator(".sb-output-title")).toHaveText("Interview prep");
    await expect(demo(page).getByText("Here. Done. Your Northstar prep is ready.")).toBeVisible();
  });

  test("play still walks through the stages, without movement", async ({ page }) => {
    await page.goto("/");
    await demo(page).getByRole("button", { name: "Play", exact: true }).click();
    await expect(demo(page)).toHaveAttribute("data-stage", "capture");
    await expect(demo(page)).toHaveAttribute("data-status", "playing");
    await expect(demo(page)).toHaveAttribute("data-stage", "understand", { timeout: 5_000 });
  });
});
