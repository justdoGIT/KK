import { test, expect, type Page } from "@playwright/test";

async function place(page: Page, selector: string, top = 56) {
  await page.locator(selector).evaluate((el, top) => scrollTo({
    top: scrollY + el.getBoundingClientRect().top - top, behavior: "instant",
  }), top);
  await expect.poll(() => page.locator(selector).evaluate(el =>
    Number(getComputedStyle(el.closest(".reveal") ?? el).opacity)), { timeout: 25_000 }).toBe(1);
}

async function seek(page: Page, selector: string, progress: number) {
  await page.locator(selector).evaluate((el, value) => scrollTo({
    top: scrollY + el.getBoundingClientRect().top + (el.clientHeight - innerHeight) * value,
    behavior: "instant",
  }), progress);
}

test.describe("Mobile presentation polish", () => {
  test.describe.configure({ timeout: 120_000 });
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("fits the complete opening page without an inner scrollbar", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await place(page, "#hero");
      const layout = await page.locator("#hero").evaluate(el => {
        const details = el.querySelector<HTMLElement>(".hero-details")!;
        const frame = el.querySelector<HTMLElement>(".hero-frame-container")!;
        const badge = el.querySelector<HTMLElement>(".hero-badge")!;
        return { innerOverflow: details.scrollHeight - details.clientHeight,
          frameOverflow: frame.scrollHeight - frame.clientHeight,
          badgeOverflow: badge.scrollWidth - badge.clientWidth,
          lastBottom: el.querySelector(".hero-tour-hint")!.getBoundingClientRect().bottom,
          bottom: el.getBoundingClientRect().bottom };
      });
      expect(layout.innerOverflow).toBeLessThanOrEqual(1);
      expect(layout.frameOverflow).toBeLessThanOrEqual(1);
      expect(layout.badgeOverflow).toBeLessThanOrEqual(1);
      expect(layout.lastBottom).toBeLessThanOrEqual(layout.bottom - 8);
      for (const label of ["Explore Projects", "View Services", "Start a conversation"]) {
        await expect(page.locator(".hero-actions").getByRole("link", { name: label })).toBeInViewport({ ratio: 1 });
      }
      await page.screenshot({ path: test.info().outputPath(`opening-${viewport.width}.png`) });
    }
  });

  test("reveals the first product from its card back as the page approaches", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await place(page, "#work", 580);
    const rail = page.locator("#work .mobile-board-viewport");
    const first = page.locator("#work .mobile-board-front").first();
    await expect(rail).toHaveAttribute("data-card-motion", "entrance");
    await expect(first).toHaveAttribute("inert");
    await page.screenshot({ path: test.info().outputPath("product-back.png") });
    await place(page, "#work", 300);
    await expect(page.locator("#work .mobile-board-motion").first()).not.toHaveCSS("transform", "none");
    await page.screenshot({ path: test.info().outputPath("product-entry-turn.png") });
    await place(page, "#work");
    await expect(rail).toHaveAttribute("data-card-motion", "settled");
    await expect(first).not.toHaveAttribute("inert");
    await expect(page.locator("#work .mobile-board-motion").first()).toHaveCSS("transform", "none");
  });

  test("pushes the industrial card aside without a second outer frame", async ({ page, context }) => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await place(page, "#visual-lab");
    const rail = page.locator("#visual-lab .mobile-board-viewport");
    await rail.evaluate(el => {
      el.style.scrollSnapType = "none";
      el.scrollLeft = (el.children[1] as HTMLElement).offsetLeft * .45;
    });
    await expect(rail).toHaveAttribute("data-card-motion", "push");
    const poses = await page.locator("#visual-lab .mobile-board-motion").evaluateAll(els =>
      els.slice(0, 2).map(el => ({ left: el.getBoundingClientRect().left,
        transform: getComputedStyle(el).transform, z: Number(getComputedStyle(el.parentElement!).zIndex) })));
    expect(poses[0].left).toBeLessThan(0);
    expect(poses[1].left).toBeGreaterThan(20);
    expect(poses[1].left).toBeLessThan(390);
    expect(poses[1].z).toBeGreaterThan(poses[0].z);
    await expect(page.locator("#visual-lab .mobile-board-slide").first()).toHaveCSS("border-left-width", "0px");
    await expect(page.locator("#services .mobile-board-slide").first()).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await page.screenshot({ path: test.info().outputPath("industrial-push.png") });
    await rail.evaluate(el => { el.style.removeProperty("scroll-snap-type"); el.scrollLeft = 0; });
    await expect(rail).toHaveAttribute("data-card-motion", "settled");
    const box = (await rail.boundingBox())!;
    const cdp = await context.newCDPSession(page);
    const points = (fraction: number) => [{ x: box.x + box.width * fraction, y: box.y + 70, radiusX: 1, radiusY: 1, force: 1, id: 1 }];
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: points(.85) });
    for (const fraction of [.7, .55, .4, .25, .1, .025]) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: points(fraction) });
      await page.waitForTimeout(40);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await cdp.detach();
    await expect(page.locator("#visual-lab .mobile-board-count")).toHaveText("2 / 6");
    await expect(rail).toHaveAttribute("data-card-motion", "settled");
    await expect(page.locator("#visual-lab .mobile-board-motion").nth(1)).toHaveCSS("transform", "none");
  });

  test("moves Career and terminal by only part of each wheel gesture", async ({ page }) => {
    await page.goto("/");
    for (const [section, pane, progress] of [["#career", ".career-entries", .07], [".terminal-scroll-section", ".terminal-body", .328]] as const) {
      await seek(page, section, progress);
      await page.waitForTimeout(600);
      const body = page.locator(pane);
      const box = (await body.boundingBox())!;
      const before = await page.evaluate(() => scrollY);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.wheel(0, 120);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 50);
      expect(await page.evaluate(() => scrollY) - before).toBeLessThan(80);
      expect(await page.locator(section).evaluate(el => el.clientHeight / innerHeight)).toBeGreaterThan(7);
    }
  });

  test("places a larger astronaut window close to the mission heading", async ({ page }) => {
    await page.goto("/");
    await seek(page, ".aj-section", 0);
    await expect(page.locator(".aj-stage")).toHaveAttribute("data-scene-ready", "true", { timeout: 60_000 });
    await page.waitForTimeout(600);
    const card = (await page.locator(".aj-card-edge").boundingBox())!;
    const intro = (await page.locator(".aj-intro").boundingBox())!;
    expect(card.width).toBeGreaterThan(390 * .8);
    expect(card.y - intro.y - intro.height).toBeGreaterThan(10);
    expect(card.y - intro.y - intro.height).toBeLessThan(90);
    await page.screenshot({ path: test.info().outputPath("mission-opening.png") });
  });
});
