import { test, expect, type Page } from "@playwright/test";
import { createServer, type ViteDevServer } from "vite";

let server: ViteDevServer;
let url: string;
test.setTimeout(process.env.CI ? 180_000 : 90_000);
test.beforeAll(async () => {
  server = await createServer({ server: { host: "127.0.0.1", port: 0 }, logLevel: "error" });
  await server.listen();
  url = server.resolvedUrls!.local[0];
});
test.afterAll(async () => { await server?.close(); });

async function open(page: Page) {
  await page.goto(url);
  // Intentional input before auto-start must remain paused until Resume.
  await expect(page.locator(".reading-tour-control")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".reading-tour-control")).toHaveAttribute("data-tour-status", "paused");
}

async function fanPosition(page: Page, progress: number) {
  await page.locator("#work").evaluate(async (section, p) => {
    // @ts-expect-error Browser-only Vite module path.
    const { scrollToY } = await import("/src/motion/smooth-scroll.ts");
    scrollToY(scrollY + section.getBoundingClientRect().top + (section.clientHeight - innerHeight) * 0.75 * p, { immediate: true });
  }, progress);
}

test("finishes fanning before capturing wheel input and retains card content on reversal", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page);
  const stage = page.locator("#work .lusion-cards-stage");
  const body = stage.locator(".card-front-scroll-body").first();
  const retained = await body.elementHandle();
  await fanPosition(page, 0.65);
  await expect(stage).not.toHaveClass(/is-settled/);
  await expect(body).toHaveCSS("overflow-y", "hidden");
  await expect(body).not.toHaveAttribute("data-lenis-prevent", "");
  await page.screenshot({ path: test.info().outputPath("fanning.png") });
  const before = await page.evaluate(() => scrollY);
  const box = (await body.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 250);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 100);
  expect(await body.evaluate(el => el.scrollTop)).toBe(0);

  // Fan Out must settle all four at its exact rounded target.
  await fanPosition(page, 0);
  await page.getByRole("button", { name: /Fan Out/ }).click();
  await expect(stage).toHaveClass(/is-settled/, { timeout: 20_000 });
  await expect(stage.locator(".lusion-card-isolated-cell--settled")).toHaveCount(4);
  await expect(body).toHaveCSS("overflow-y", "auto");
  await body.hover();
  const landed = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 160);
  await expect.poll(() => body.evaluate(el => el.scrollTop)).toBeGreaterThan(40);
  expect(Math.abs(await page.evaluate(() => scrollY) - landed)).toBeLessThan(2);
  const offset = await body.evaluate(el => el.scrollTop);
  await page.screenshot({ path: test.info().outputPath("landed.png") });
  await fanPosition(page, 0.9);
  await expect(stage).not.toHaveClass(/is-settled/);
  await expect(body).toHaveCSS("overflow-y", "hidden");
  expect(await retained!.evaluate(el => el.isConnected)).toBe(true);
  await fanPosition(page, 1);
  await expect(stage).toHaveClass(/is-settled/);
  expect(await retained!.evaluate(el => el === document.querySelector("#work .card-front-scroll-body"))).toBe(true);
  expect(await body.evaluate(el => el.scrollTop)).toBe(offset);
  await expect(stage.locator(".lusion-card-flipper").first()).toHaveCSS("transform", "none");
  // Switching to a short-screen layout must clear retained imperative styles.
  await fanPosition(page, 0);
  await page.setViewportSize({ width: 1440, height: 600 });
  await expect(page.locator("#work")).toHaveClass(/is-static/);
  await expect(stage.locator(".lusion-card-isolated-cell--settled")).toHaveCount(4);
  for (const front of await stage.locator(".lusion-card-front").all()) {
    await expect(front).toHaveCSS("opacity", "1");
    await expect(front).toHaveCSS("pointer-events", "auto");
    await expect(front).not.toHaveAttribute("inert");
    await expect(front).not.toHaveAttribute("aria-hidden", "true");
  }
});

test("Resume reads landed cards in place and preserves manually scrolled text", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page);
  await fanPosition(page, 1.02);
  const stage = page.locator("#work .lusion-cards-stage");
  await expect(stage).toHaveClass(/is-settled/);
  const body = stage.locator(".card-front-scroll-body").first();
  await body.evaluate(el => { el.scrollTop = 50; });
  const offset = await body.evaluate(el => el.scrollTop);
  const y = await page.evaluate(() => scrollY);
  const tour = page.locator(".reading-tour-control");
  await tour.click();
  await expect(tour).toHaveAttribute("data-tour-step", "work-0");
  await page.waitForTimeout(2200);
  expect(Math.abs(await page.evaluate(() => scrollY) - y)).toBeLessThan(2);
  expect(await body.evaluate(el => el.scrollTop)).toBe(offset);
  await tour.click();
  await expect(tour).toHaveAttribute("data-tour-status", "paused");
  await page.waitForTimeout(200);
  await tour.click();
  await page.waitForTimeout(1400);
  expect(Math.abs(await page.evaluate(() => scrollY) - y)).toBeLessThan(2);
  expect(await body.evaluate(el => el.scrollTop)).toBe(offset);
  await page.screenshot({ path: test.info().outputPath("resumed.png") });
});

test("settled grid cards receive no style mutations while scrolling elsewhere", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page);
  const card = page.locator(".process-step-card").first();
  await card.evaluate(el => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect(card).toHaveClass(/is-open/);
  const changes = await card.evaluate(el => new Promise<number>(resolve => {
    let mutations = 0;
    const observer = new MutationObserver(entries => { mutations += entries.length; });
    observer.observe(el, { attributes: true, attributeFilter: ["style", "class"] });
    let frames = 0;
    const scroll = () => {
      window.scrollBy({ top: 2, behavior: "instant" });
      if (++frames < 20) requestAnimationFrame(scroll);
      else requestAnimationFrame(() => { observer.disconnect(); resolve(mutations); });
    };
    requestAnimationFrame(scroll);
  }));
  expect(changes).toBe(0);
});

test("keeps the complete static card layout readable on short screens", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.goto(url);
  const section = page.locator("#work");
  await expect(section).toHaveClass(/is-static/);
  const fronts = section.locator(".lusion-card-front");
  await expect(fronts).toHaveCount(4);
  for (const front of await fronts.all()) {
    await expect(front).not.toHaveAttribute("inert");
    await expect(front).not.toHaveAttribute("aria-hidden", "true");
    await expect(front).toHaveCSS("transform", "none");
    await expect(front.locator(".card-front-scroll-body")).toHaveCSS("overflow-y", "visible");
    expect(await front.evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThan(2);
    await front.locator(".card-front-bottom").scrollIntoViewIfNeeded();
    await expect(front.locator(".card-front-bottom")).toBeInViewport();
  }
  await page.screenshot({ path: test.info().outputPath("static-cards.png") });
});

for (const width of [320, 375, 1440]) {
  test(`keeps the larger KP logo and tour control inside the header at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 600 });
    const page = await context.newPage();
    try {
      await open(page);
      const header = (await page.locator(".nav-bar").boundingBox())!;
      const mark = page.locator(".nav-brand-mark");
      await expect(mark).toBeVisible();
      const logo = (await mark.boundingBox())!;
      expect(logo.width).toBe(44);
      expect(logo.height).toBe(44);
      for (const selector of [".nav-brand", ".nav-brand-mark", ".reading-tour-control", ".nav-cta"]) {
        const box = (await page.locator(selector).boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
        expect(box.y).toBeGreaterThanOrEqual(header.y);
        expect(box.y + box.height).toBeLessThanOrEqual(header.y + header.height);
      }
      if (width < 600) expect((await page.locator(".reading-tour-control").boundingBox())!.height).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThan(2);
      await page.screenshot({ path: test.info().outputPath(`header-${width}.png`) });
    } finally { await context.close(); }
  });
}
