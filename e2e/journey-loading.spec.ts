import { test, expect, type Page } from "@playwright/test";
import { createServer, type ViteDevServer } from "vite";

let server: ViteDevServer;
let url: string;
test.beforeAll(async () => {
  server = await createServer({ server: { host: "127.0.0.1", port: 0 }, logLevel: "error" });
  await server.listen();
  url = server.resolvedUrls!.local[0];
});
test.afterAll(async () => { await server?.close(); });

async function showJourney(page: Page, progress: number) {
  await page.locator(".aj-section").evaluate(async (section, t) => {
    // @ts-expect-error Browser-only Vite module path.
    const { scrollToY } = await import("/src/motion/smooth-scroll.ts");
    scrollToY(scrollY + section.getBoundingClientRect().top + (section.clientHeight - innerHeight) * t, { immediate: true });
  }, progress);
}

test("keeps the opening scene poster until delayed Earth textures have rendered", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1280, height: 800 });
  let release!: () => void;
  const delayed = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/earth-clouds-2048.webp", async route => { await delayed; await route.continue(); });
  try {
    await page.goto(url);
    await showJourney(page, 0.02);
    const stage = page.locator(".aj-stage");
    const poster = stage.locator(".aj-fallback-art");
    await expect(poster).toBeVisible();
    await expect.poll(() => poster.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(stage).toHaveAttribute("data-scene-ready", "false");
    await expect(stage.locator(".space-backdrop-svg, .aj-fallback-astronaut")).toHaveCount(0);
    await page.mouse.wheel(0, 40);
    await page.waitForTimeout(700);
    await expect(stage).toHaveAttribute("data-phase", "cardShow");
    await expect(poster).toBeVisible();
    release();
    await expect(stage).toHaveAttribute("data-scene-ready", "true", { timeout: 60_000 });
    await expect(poster).toBeHidden({ timeout: 20_000 });
    await showJourney(page, 0.02);
    await page.screenshot({ path: test.info().outputPath("mission-loaded.png") });
    for (const [progress, phase] of [[0.18, "title"], [0.30, "blackTunnel"], [0.52, "frameBreak"], [0.98, "wait"]] as const) {
      await showJourney(page, progress);
      await expect(stage).toHaveAttribute("data-phase", phase);
    }
    await expect(page.locator(".contact-banner")).toHaveAttribute("data-finale-settled", "true");
    expect(await page.locator("#contact").evaluate(el => parseFloat(getComputedStyle(el).paddingBottom))).toBeLessThanOrEqual(24);
    await showJourney(page, 1);
    await expect.poll(() => page.evaluate(() => {
      const footer = document.querySelector(".footer")!.getBoundingClientRect();
      const card = document.querySelector(".contact-banner-mover")!.getBoundingClientRect();
      return footer.top - card.bottom;
    })).toBeLessThanOrEqual(50);
    await page.screenshot({ path: test.info().outputPath("mission-finale.png"), timeout: 60_000 });
  } finally {
    release();
    await page.unrouteAll({ behavior: "ignoreErrors" }).catch(() => {});
  }
});

test("keeps the poster and complete contact card accessible without motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url);
  for (const viewport of [{ width: 320, height: 568 }, { width: 768, height: 1024 }, { width: 1381, height: 367 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    const fallback = page.locator(".aj-fallback");
    await expect(fallback).toBeAttached();
    expect(await fallback.evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThan(2);
    expect(await fallback.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThan(2);
    const last = fallback.locator(".contact-assurances-grid");
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThan(2);
  }
});
