import { test, expect, type Locator } from "@playwright/test";
import { createServer, type ViteDevServer } from "vite";

declare global {
  interface Window { gpuDraws: WeakMap<HTMLCanvasElement | OffscreenCanvas, number> }
}

let server: ViteDevServer;
let url: string;
test.beforeAll(async () => {
  server = await createServer({ server: { host: "127.0.0.1", port: 0 }, logLevel: "error" });
  await server.listen();
  url = server.resolvedUrls!.local[0];
});
test.afterAll(async () => { await server?.close(); });

async function show(element: Locator) {
  await element.evaluate(async el => {
    // @ts-expect-error Browser-only Vite module path.
    const { scrollToY } = await import("/src/motion/smooth-scroll.ts");
    scrollToY(scrollY + el.getBoundingClientRect().top, { immediate: true });
  });
}

test("renders at native resolution and preserves idle offscreen WebGL contexts", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(() => {
    window.gpuDraws = new WeakMap();
    for (const proto of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
      const original = proto.clear;
      proto.clear = function (mask: number) {
        window.gpuDraws.set(this.canvas, (window.gpuDraws.get(this.canvas) ?? 0) + 1);
        return original.call(this, mask);
      };
    }
  });
  await page.goto(url);
  const hero = page.locator(".scene-container canvas");
  await expect(hero).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => hero.evaluate(canvas => window.gpuDraws.get(canvas as HTMLCanvasElement) ?? 0), { timeout: 45000 }).toBeGreaterThan(3);
  expect(await hero.evaluate(canvas => (canvas as HTMLCanvasElement).width / canvas.clientWidth)).toBeLessThanOrEqual(1.01);
  await page.screenshot({ path: test.info().outputPath("hero-webgl.png") });

  await show(page.locator("#journey"));
  const fleet = page.locator(".sand-canvas-container canvas");
  await expect(fleet).toBeVisible({ timeout: 30_000 });
  await expect(fleet).toBeInViewport();
  await expect.poll(() => fleet.evaluate(canvas => window.gpuDraws.get(canvas as HTMLCanvasElement) ?? 0), { timeout: 45_000 }).toBeGreaterThan(3);
  const original = await fleet.elementHandle();
  await page.screenshot({ path: test.info().outputPath("board-lifecycle-webgl.png") });

  // Read a text card while both earlier scenes are out of view.
  await show(page.locator(".system-showcase-card").first());
  await expect(fleet).toHaveCount(1);
  await page.waitForTimeout(300);
  const heroDraws = await hero.evaluate(canvas => window.gpuDraws.get(canvas as HTMLCanvasElement));
  const fleetDraws = await fleet.evaluate(canvas => window.gpuDraws.get(canvas as HTMLCanvasElement));
  await page.waitForTimeout(700);
  expect(await hero.evaluate(canvas => window.gpuDraws.get(canvas as HTMLCanvasElement))).toBe(heroDraws);
  expect(await fleet.evaluate(canvas => window.gpuDraws.get(canvas as HTMLCanvasElement))).toBe(fleetDraws);
  await show(page.locator("#journey"));
  expect(await original!.evaluate(canvas => canvas === document.querySelector(".sand-canvas-container canvas"))).toBe(true);
  await expect.poll(() => fleet.evaluate(canvas => window.gpuDraws.get(canvas as HTMLCanvasElement) ?? 0)).toBeGreaterThan(fleetDraws!);
});

test("caps high-density mobile graphics while keeping the header and cards readable", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.goto(url);
    const canvas = page.locator(".scene-container canvas");
    await expect(canvas).toBeVisible({ timeout: 30_000 });
    expect(await canvas.evaluate(el => (el as HTMLCanvasElement).width / el.clientWidth)).toBeLessThanOrEqual(1.51);
    await page.locator("#services").evaluate(el => el.scrollIntoView({ block: "start", behavior: "instant" }));
    const carousel = page.locator("#services .mobile-board-carousel");
    const tour = page.locator(".reading-tour-control");
    if (await tour.getAttribute("data-tour-status") === "playing") await tour.tap();
    for (let i = 1; i < 6; i++) {
      await carousel.getByRole("button", { name: "Next board" }).tap();
      await expect(carousel.locator(".mobile-board-count")).toHaveText(`${i + 1} / 6`);
    }
    await expect(carousel.locator(".mobile-board-count")).toHaveText("6 / 6");
    const slide = carousel.locator(".mobile-board-slide").last();
    await slide.evaluate(el => { el.scrollTop = el.scrollHeight; });
    const finalDetail = await slide.locator(".service-deliv-pill").last().boundingBox();
    expect(finalDetail!.y + finalDetail!.height).toBeLessThanOrEqual(844);
    await page.screenshot({ path: test.info().outputPath("mobile-sixth-board.png") });
  } finally {
    await context.close();
  }
});
