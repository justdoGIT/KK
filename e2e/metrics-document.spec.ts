import { test, expect, type Page } from "@playwright/test";

async function scrollDocument(page: Page, progress: number) {
  await page.locator(".metrics-document-section").evaluate((section, progress) => {
    const stage = section.querySelector<HTMLElement>(".metrics-document-stage")!;
    const pinTop = parseFloat(getComputedStyle(stage).top);
    const top = section.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top - pinTop + (section.clientHeight - stage.clientHeight) * progress, behavior: "instant" });
  }, progress);
}

test.describe("Mobile metrics document", () => {
  test.use({ viewport: { width: 414, height: 736 }, isMobile: true, hasTouch: true });

  test("unrolls downward with scrolling, stays still while reading, and rolls back up", async ({ page }, testInfo) => {
    await page.goto("/");
    const document = page.locator(".metrics-document");
    const roll = page.locator(".metrics-document-roll");
    const metrics = page.locator(".metrics-document-metric");
    await scrollDocument(page, 0);
    await expect(document).toHaveAttribute("data-unroll", "closed");
    await expect(metrics.first()).not.toBeInViewport();
    const closed = (await roll.boundingBox())!;
    await page.screenshot({ path: testInfo.outputPath("document-rolled.png") });

    await page.mouse.move(200, 400);
    await page.mouse.wheel(0, 430);
    await expect(document).toHaveAttribute("data-unroll", "unrolling");
    await expect.poll(async () => (await roll.boundingBox())!.y).toBeGreaterThan(closed.y + 120);
    await expect(page.locator("html")).not.toHaveClass(/lenis-scrolling/);
    await scrollDocument(page, 0.52);
    await expect(metrics.nth(1)).toBeInViewport({ ratio: 0.999 });
    await expect(metrics.last()).not.toBeInViewport();
    await page.waitForTimeout(500);
    const middle = (await roll.boundingBox())!;
    await page.waitForTimeout(700);
    expect(Math.abs((await roll.boundingBox())!.y - middle.y)).toBeLessThan(1);
    expect(middle.height).toBeLessThan(closed.height);
    await page.screenshot({ path: testInfo.outputPath("document-unrolling.png") });

    await scrollDocument(page, 0.9);
    await expect(document).toHaveAttribute("data-unroll", "open");
    await expect(page.locator(".metrics-document-paper")).toHaveCSS("clip-path", "none");
    await expect(metrics).toHaveCount(6);
    for (const metric of await metrics.all()) await expect(metric).toBeInViewport({ ratio: 0.999 });
    await page.screenshot({ path: testInfo.outputPath("document-open.png") });

    await scrollDocument(page, 0);
    await expect(document).toHaveAttribute("data-unroll", "closed");
    await expect(metrics.first()).not.toBeInViewport();
    await expect.poll(async () => Math.abs((await roll.boundingBox())!.y - closed.y)).toBeLessThan(1);
  });

  test("keeps every metric reachable on a small phone and after rotation", async ({ page }) => {
    await page.goto("/");
    for (const viewport of [{ width: 320, height: 568 }, { width: 736, height: 414 }]) {
      await page.setViewportSize(viewport);
      const seen = new Set<number>();
      for (const progress of [0.3, 0.4, 0.5, 0.6, 0.7, 0.9]) {
        await scrollDocument(page, progress);
        await page.waitForTimeout(100);
        const visible = await page.locator(".metrics-document-stage").evaluate((stage) => {
          const roll = stage.querySelector(".metrics-document-roll")!.getBoundingClientRect();
          const stageBox = stage.getBoundingClientRect();
          return [...stage.querySelectorAll(".metrics-document-metric")].flatMap((metric, index) => {
            const box = metric.getBoundingClientRect();
            return box.top >= stageBox.top && box.bottom <= roll.top && box.left >= 0 && box.right <= innerWidth ? [index] : [];
          });
        });
        visible.forEach((index) => seen.add(index));
      }
      expect(seen.size, `Every metric can be read at ${viewport.width}×${viewport.height}`).toBe(6);
      expect(await page.locator(".metrics-document-stage").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      await expect(page.locator(".metrics-document-signoff")).toBeInViewport({ ratio: 0.999 });
    }

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".metrics-document-roll")).toHaveCount(0);
    await expect(page.locator(".metrics-document-paper")).toHaveCSS("clip-path", "none");
    await expect(page.locator(".metrics-document-stage")).toHaveCSS("position", "relative");
    await expect(page.locator(".metrics-document")).toHaveCSS("transform", "none");
    for (const metric of await page.locator(".metrics-document-metric").all()) {
      await metric.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
      await expect(metric).toBeInViewport({ ratio: 0.999 });
    }
  });
});

test("preserves the desktop dice and tablet metrics grid", async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.keyboard.press("Escape");
  await expect(page.locator(".metrics-document-section")).toHaveCount(0);
  await expect(page.locator(".metrics-dice .metric-strip-card")).toHaveCount(6);
  // Test the dice on their own, with the expensive hero fully out of view.
  await page.locator(".client-metrics-strip").evaluate(element =>
    element.scrollIntoView({ block: "start", behavior: "instant" }));
  await expect(page.locator(".metrics-dice")).toHaveAttribute("data-dice", "open", { timeout: 30000 });
  await expect(page.locator(".metrics-dice .metric-strip-card").first()).toHaveCSS("transform", "none");

  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.locator(".metrics-document-section")).toHaveCount(0);
  await expect(page.locator(".metrics-dice")).toHaveCount(0);
  await expect(page.locator(".metrics-strip-inner .metric-strip-card")).toHaveCount(6);
});
