import { test, expect, type Page } from "@playwright/test";
import { createServer, type ViteDevServer } from "vite";
import { services } from "../src/content/services.ts";

let server: ViteDevServer;
let url: string;

test.beforeAll(async () => {
  server = await createServer({ server: { host: "127.0.0.1", port: 0 }, logLevel: "error" });
  await server.listen();
  url = server.resolvedUrls!.local[0];
});
test.afterAll(async () => { await server?.close(); });

async function showService(page: Page, index: number) {
  await page.locator("#services").evaluate(async (section, i) => {
    // Use the public navigation and authored timeline, including reverse travel.
    // @ts-expect-error Browser-only Vite module path.
    const { throwProgressFor } = await import("/src/motion/throw-deck.ts");
    // @ts-expect-error Browser-only Vite module path.
    const { scrollToY } = await import("/src/motion/smooth-scroll.ts");
    const track = section.querySelector<HTMLElement>(".services-deck-track")!;
    const container = section.querySelector<HTMLElement>(".services-deck-container");
    const gap = container ? parseFloat(getComputedStyle(container).rowGap) || 0 : 0;
    const preceding = Array.from(section.querySelectorAll<HTMLElement>(".service-card-deck-item")).slice(0, i);
    const target = section.classList.contains("services-throw")
      ? track.getBoundingClientRect().top + (track.clientHeight - innerHeight) * throwProgressFor(i, 6)
      : container!.getBoundingClientRect().top + preceding.reduce((sum, card) => sum + card.offsetHeight + gap, 0) - 88;
    scrollToY(scrollY + target, { immediate: true });
  }, index);
}

for (const viewport of [{ width: 1280, height: 800 }, { width: 1280, height: 900 }, { width: 1024, height: 768 }, { width: 1920, height: 1080 }, { width: 2560, height: 1440 }, { width: 1381, height: 367 }, { width: 768, height: 1024 }]) {
  test(`all six service boards retain complete readable content at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(url);
    const heights = await page.locator("#services .service-card-deck-item").evaluateAll(cards => cards.map(card => (card as HTMLElement).offsetHeight));
    expect(heights.every(height => Math.abs(height - heights[2]) <= 1)).toBe(true);
    expect(await page.locator("#services .service-card-deck-item").evaluateAll(cards => cards.map(card => (card as HTMLElement).dataset.serviceId)))
      .toEqual(services.map(service => service.id));
    await expect(page.locator("#services")).toHaveClass(/services-(throw|stack)/);
    for (let i = 0; i < services.length; i++) {
      await showService(page, i);
      const card = page.locator("#services .service-card-deck-item").nth(i);
      const id = await card.getAttribute("data-service-id");
      const service = services.find(item => item.id === id)!;
      const pinned = await page.locator("#services").evaluate(el => el.classList.contains("services-throw"));
      if (pinned) await expect(card).toHaveAttribute("data-settled", "true");
      await expect(card).toHaveCSS("transform", "none");
      await expect(card).toHaveCSS("will-change", "auto");
      await expect(card.locator(".service-capabilities-list li span:last-child")).toHaveText(service.capabilities);
      await expect(card.locator(".service-deliv-pill")).toHaveCount(service.deliverables.length);
      if (pinned) await expect.poll(() => card.evaluate(el => el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(viewport.height);
      expect(await card.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThan(2);
      expect(await card.evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThan(2);
      await expect(card).toHaveCSS("overflow-y", "visible");
      await card.hover({ position: { x: 120, y: 100 } });
      await expect(card).toHaveCSS("transform", "none");
      const last = card.locator(".service-deliv-pill").last();
      await expect(last).toContainText(service.deliverables.at(-1)!);
      await expect.poll(async () => {
        const box = (await card.boundingBox())!;
        const detail = (await last.boundingBox())!;
        return detail.y >= box.y && detail.y + detail.height <= box.y + box.height;
      }).toBe(true);
      if (!pinned) await last.scrollIntoViewIfNeeded();
      await expect(last).toBeInViewport();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThan(2);
    await page.screenshot({ path: test.info().outputPath(`services-${viewport.width}x${viewport.height}.png`) });
    await showService(page, 1);
    await expect(page.locator("#services .service-card-deck-item").nth(1)).toHaveCSS("transform", "none");
  });
}

test("reflows the deck when resized or when text is enlarged", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url);
  const section = page.locator("#services");
  await expect(section).toHaveClass(/services-throw/);
  await showService(page, 5);
  await page.setViewportSize({ width: 1381, height: 367 });
  await expect(section).not.toHaveClass(/services-throw/);
  for (const card of await section.locator(".service-card-deck-item").all()) {
    await expect(card).toHaveCSS("transform", "none");
    await expect(card.locator(".service-card-main")).toHaveCSS("opacity", "1");
    expect(await card.evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThan(2);
  }
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect(section).toHaveClass(/services-throw/);
  await showService(page, 5);
  await page.evaluate(() => { document.documentElement.style.fontSize = "24px"; });
  await expect(section).not.toHaveClass(/services-throw/);
  for (const card of await section.locator(".service-card-deck-item").all()) {
    expect(await card.evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThan(2);
    expect(await card.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThan(2);
  }
});

test("scrolls a hovered mission card without moving the page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(url);
  await page.locator(".lusion-deck-header").scrollIntoViewIfNeeded();
  const cards = page.locator(".lusion-card-isolated-cell--settled");
  const stage = page.locator(".lusion-cards-stage");
  const box = (await stage.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let step = 0; step < 20 && await cards.count() < 4; step++) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(100);
  }
  await expect(cards).toHaveCount(4);
  const body = cards.first().locator(".card-front-scroll-body");
  await expect.poll(() => body.evaluate(element => element.scrollHeight - element.clientHeight)).toBeGreaterThan(0);
  await body.evaluate(element => { element.scrollTop = 0; });
  await body.hover();
  let stableFrames = 0;
  let previous = await page.evaluate(() => scrollY);
  for (let attempt = 0; attempt < 50 && stableFrames < 3; attempt++) {
    await page.waitForTimeout(100);
    const current = await page.evaluate(() => scrollY);
    stableFrames = Math.abs(current - previous) < 1 ? stableFrames + 1 : 0;
    previous = current;
  }
  expect(stableFrames).toBe(3);
  const pageBefore = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 360);
  await expect.poll(() => body.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  expect(Math.abs(await page.evaluate(() => scrollY) - pageBefore)).toBeLessThan(2);

  await body.evaluate(element => { element.scrollTop = element.scrollHeight; });
  const pageAtBottom = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 360);
  await page.waitForTimeout(300);
  expect(Math.abs(await page.evaluate(() => scrollY) - pageAtBottom)).toBeLessThan(2);
});

test("settled card text stays flat while hovered, with no idle style churn", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(url);
  for (const selector of [".system-showcase-card", ".process-step-card", ".offer-card", ".skill-category-card"]) {
    const card = page.locator(selector).first();
    if (selector === ".skill-category-card") {
      await page.locator(".skill-domains-section").evaluate(async section => {
        // @ts-expect-error Browser-only Vite module path.
        const { scrollToY } = await import("/src/motion/smooth-scroll.ts");
        scrollToY(scrollY + section.getBoundingClientRect().top + (section.clientHeight - innerHeight) * 0.9, { immediate: true });
      });
    } else {
      await card.evaluate(el => el.scrollIntoView({ block: "center", behavior: "instant" }));
    }
    await card.hover({ position: { x: 80, y: 100 } });
    await expect(card).toHaveCSS("transform", "none");
    await expect(card).toHaveCSS("filter", "none");
    await expect(card).toHaveCSS("will-change", "auto");
    await expect(card.locator("h3").first()).toHaveCSS("transform", "none");
    await card.evaluate(el => new Promise<void>(resolve => {
      let changes = 0;
      const observer = new MutationObserver(entries => { changes += entries.length; });
      observer.observe(el, { attributes: true, subtree: true, attributeFilter: ["style"] });
      setTimeout(() => {
        observer.disconnect();
        el.dataset.idleStyleChanges = String(changes);
        resolve();
      }, 500);
    }));
    await expect(card).toHaveAttribute("data-idle-style-changes", "0");
    await page.screenshot({ path: test.info().outputPath(`${selector.slice(1)}-hover.png`) });
  }
  await expect(page.locator(".global-ribbon-svg filter")).toHaveCount(0);
  await expect.poll(() => page.locator(".global-ribbon-svg > g").evaluateAll(groups => groups.every(g => getComputedStyle(g).transform === "none"))).toBe(true);
});
