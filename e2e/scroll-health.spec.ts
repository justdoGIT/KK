import { test, expect, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { STAGE_STARTS } from "../src/scene/career/career-timeline.ts";

async function scrollSection(page: Page, selector: string, progress = 0) {
  await expect(page.locator("html")).not.toHaveClass(/lenis-smooth/, { timeout: 30_000 });
  // Lazy sections can finish measuring during a jump. Recompute the target
  // until it lands, then let native scroll synchronize before wheel input.
  await expect.poll(() => page.locator(selector).first().evaluate((section, t) => {
    const distance = section.getBoundingClientRect().top + Math.max(0, section.clientHeight - innerHeight) * t;
    if (Math.abs(distance) >= 2) window.scrollBy({ top: distance, behavior: "instant" });
    return Math.abs(distance);
  }, progress), { timeout: 30_000 }).toBeLessThan(2);
  await page.waitForTimeout(500);
}

test("scrolls every scene without runtime warnings and retains the career renderer", async ({ page, browserName }) => {
  // This verifies every scene and renderer lifecycle, including cold shader
  // preparation on software GPUs; frame responsiveness is profiled separately.
  test.setTimeout(480_000);
  await page.setViewportSize({ width: 1280, height: 800 });
  const issues: string[] = [];
  page.on("console", message => {
    if (["warning", "error"].includes(message.type())) issues.push(`${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", error => issues.push(error.message));
  page.on("requestfailed", request => issues.push(`request: ${request.url()} ${request.failure()?.errorText}`));
  page.on("response", response => { if (response.status() >= 400) issues.push(`${response.status()}: ${response.url()}`); });
  if (browserName === "chromium") {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Log.enable");
    cdp.on("Log.entryAdded", ({ entry }) => {
      if (["warning", "error"].includes(entry.level)) issues.push(`browser ${entry.level}: ${entry.text}`);
    });
  }
  await page.addInitScript(() => {
    window.gpuDraws = new WeakMap();
    for (const prototype of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
      const clear = prototype.clear;
      prototype.clear = function (mask: number) {
        window.gpuDraws.set(this.canvas, (window.gpuDraws.get(this.canvas) ?? 0) + 1);
        return clear.call(this, mask);
      };
    }
  });
  const draws = (selector: string) => page.locator(selector).evaluate(canvas => window.gpuDraws.get(canvas as HTMLCanvasElement) ?? 0);
  try {
    await page.goto("/");
    await expect.poll(() => draws(".scene-container canvas"), { timeout: 45_000 }).toBeGreaterThan(2);
    for (const selector of ["#services", "#journey", "#work", "#offers", "#visual-lab", "#approach"]) {
      await scrollSection(page, selector, 0.5);
      await page.mouse.wheel(0, 80);
      await page.waitForTimeout(800);
      await page.keyboard.press("Escape");
      await expect(page.locator("html")).not.toHaveClass(/lenis-smooth/, { timeout: 30_000 });
      if (selector === "#journey") await expect.poll(() => draws(".sand-canvas-container canvas"), { timeout: 45_000 }).toBeGreaterThan(2);
    }
    await scrollSection(page, "#career", 0.02);
    await expect.poll(() => draws(".career-canvas canvas"), { timeout: 60_000 }).toBeGreaterThan(2);
    const original = await page.locator(".career-canvas canvas").elementHandle();
    for (let stage = 0; stage < STAGE_STARTS.length - 1; stage++) {
      for (const local of [0.1, 0.8]) {
        const before = await draws(".career-canvas canvas");
        await scrollSection(page, "#career", STAGE_STARTS[stage] + (STAGE_STARTS[stage + 1] - STAGE_STARTS[stage]) * local);
        await expect(page.locator("#career")).toHaveAttribute("data-career-stage", String(stage));
        await expect.poll(() => draws(".career-canvas canvas"), { timeout: 20_000 }).toBeGreaterThan(before);
      }
    }
    await expect(page.locator(".career-screen-flash")).toHaveCount(0);
    for (const selector of [".skill-domains-section", ".terminal-scroll-section"]) await scrollSection(page, selector, 0.9);
    await scrollSection(page, ".aj-section", 0.02);
    await expect(page.locator(".aj-stage")).toHaveAttribute("data-scene-ready", "true", { timeout: 60_000 });
    for (const progress of [0.18, 0.3, 0.44, 0.55, 0.98]) {
      const before = await draws(".aj-hero canvas");
      await scrollSection(page, ".aj-section", progress);
      await expect.poll(() => draws(".aj-hero canvas"), { timeout: 20_000 }).toBeGreaterThan(before);
    }
    await expect(page.locator(".contact-banner")).toHaveAttribute("data-finale-settled", "true");
    await page.waitForTimeout(300);
    const paused = await draws(".career-canvas canvas");
    await page.waitForTimeout(400);
    expect(await draws(".career-canvas canvas")).toBe(paused);
    await scrollSection(page, "#career", 0.1);
    expect(await original!.evaluate(canvas => canvas === document.querySelector(".career-canvas canvas"))).toBe(true);
    await expect.poll(() => draws(".career-canvas canvas"), { timeout: 20_000 }).toBeGreaterThan(paused);
    expect(issues).toEqual([]);
  } finally {
    const path = test.info().outputPath("browser-log.json");
    await writeFile(path, JSON.stringify(issues, null, 2));
    await test.info().attach("browser-log", { path, contentType: "application/json" });
  }
});
