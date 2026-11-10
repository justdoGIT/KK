import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { TERMINAL_COMMANDS } from "../src/content/terminal.ts";

async function show(page: Page, selector: string) {
  await page.locator(selector).evaluate(el => scrollTo({
    top: scrollY + el.getBoundingClientRect().top - 56, behavior: "instant",
  }));
  await expect.poll(() => page.locator(selector).evaluate(el =>
    Number(getComputedStyle(el.closest(".reveal") ?? el).opacity)), { timeout: 25_000 }).toBe(1);
}

async function seek(page: Page, selector: string, progress: number) {
  await page.locator(selector).evaluate((el, value) => window.scrollTo({
    top: scrollY + el.getBoundingClientRect().top + (el.clientHeight - innerHeight) * value,
    behavior: "instant",
  }), progress);
}

async function swipeBoard(page: Page, context: BrowserContext, section: string) {
  await show(page, section);
  const rail = page.locator(`${section} .mobile-board-viewport`);
  await expect(rail).toBeInViewport();
  await rail.evaluate(el => el.style.removeProperty("scroll-snap-type"));
  const box = (await rail.boundingBox())!;
  const cdp = await context.newCDPSession(page);
  const points = (fraction: number) => [{ x: box.x + box.width * fraction,
    y: box.y + 60, radiusX: 1, radiusY: 1, force: 1, id: 1 }];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: points(.85) });
  for (const fraction of [.7, .55, .4, .25, .1, .025]) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: points(fraction) });
    await page.waitForTimeout(30);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}

test.describe("Refined mobile chapters", () => {
  test.describe.configure({ timeout: 90_000 });
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("keeps hero and engagement capsules equal and on one line", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/#offers");
    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      const hero = await page.locator(".hero-actions .btn:not(.btn-tertiary)").evaluateAll(els =>
        els.map(el => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })));
      expect(hero[0]).toEqual(hero[1]);
      expect(hero[0].height).toBe(44);
      const capsules = await page.locator(".offer-link-btn").evaluateAll(els => els.map(el => {
        const rect = el.getBoundingClientRect();
        const range = document.createRange();
        range.selectNode(el.firstChild!);
        return { width: rect.width, height: rect.height, line: range.getBoundingClientRect().height,
          overflow: el.scrollWidth - el.clientWidth };
      }));
      for (const capsule of capsules) {
        expect(capsule.width).toBeCloseTo(capsules[0].width, 1);
        expect(capsule.height).toBe(44);
        expect(capsule.line).toBeLessThan(20);
        expect(capsule.overflow).toBeLessThanOrEqual(1);
      }
    }
  });

  test("deals the consultancy stack and flips one product card before its text", async ({ page, context }) => {
    test.setTimeout(90_000);
    await page.goto("/#services");
    await page.evaluate(() => document.fonts.ready);
    await show(page, "#services");
    const stack = page.locator("#services .mobile-board-viewport");
    await stack.evaluate(el => {
      el.style.scrollSnapType = "none";
      el.scrollLeft = (el.children[1] as HTMLElement).offsetLeft * .3;
    });
    await expect(stack).toHaveAttribute("data-card-motion", "stack");
    await expect(page.locator("#services .mobile-board-motion").first()).not.toHaveCSS("transform", "none");
    await page.screenshot({ path: test.info().outputPath("consultancy-stack.png") });
    await stack.evaluate(el => { el.scrollLeft = (el.children[1] as HTMLElement).offsetLeft; });
    await expect(stack).toHaveAttribute("data-card-motion", "settled");
    await expect(page.locator("#services .mobile-board-count")).toHaveText("2 / 6");
    await swipeBoard(page, context, "#services");
    await expect(page.locator("#services .mobile-board-count")).toHaveText("3 / 6");

    await show(page, "#work");
    const film = page.locator("#work .mobile-board-viewport");
    await film.evaluate(el => {
      el.style.scrollSnapType = "none";
      el.scrollLeft = (el.children[1] as HTMLElement).offsetLeft * .3;
    });
    await expect(film).toHaveAttribute("data-card-motion", "flip");
    await expect(page.locator("#work .mobile-board-motion").first()).not.toHaveCSS("transform", "none");
    await page.screenshot({ path: test.info().outputPath("product-card-flip.png") });
    await film.evaluate(el => { el.scrollLeft = (el.children[1] as HTMLElement).offsetLeft; });
    await expect(film).toHaveAttribute("data-card-motion", "settled");
    await expect(page.locator("#work .mobile-board-count")).toHaveText("2 / 4");
    await expect(page.locator("#work .mobile-board-motion").nth(1)).toHaveCSS("transform", "none");
    await expect(page.locator("#work .mobile-board-front").nth(1)).not.toHaveAttribute("inert");

    await page.locator("#work .mobile-board-slide").nth(1).locator(".deck-mini-diagram-box").click();
    await expect(page.getByRole("dialog")).toHaveCSS("opacity", "1");
    const diagram = await page.locator(".arch-modal-svg").evaluate(el => {
      const svg = el as SVGSVGElement;
      const label = svg.querySelector(".arch-node-inner text")!;
      return { width: svg.getBoundingClientRect().width, viewport: innerWidth,
        renderedFont: parseFloat(getComputedStyle(label).fontSize) * svg.getBoundingClientRect().width / svg.viewBox.baseVal.width };
    });
    expect(diagram.width).toBeGreaterThan(diagram.viewport * .8);
    expect(diagram.width).toBeLessThanOrEqual(diagram.viewport);
    expect(diagram.renderedFont).toBeGreaterThanOrEqual(11);
    const framing = await page.locator(".arch-diagram-viewport").evaluate(el => {
      const frame = el.getBoundingClientRect();
      const node = el.querySelector(".arch-node-group")!.getBoundingClientRect();
      return { left: node.left - frame.left, top: node.top - frame.top, height: frame.height };
    });
    expect(framing.left).toBeLessThan(32);
    expect(framing.top).toBeGreaterThanOrEqual(0);
    expect(framing.top).toBeLessThan(framing.height - 44);
    expect(framing.height).toBeLessThan(844 * .38 + 1);
    const diagramPane = (await page.locator(".arch-diagram-viewport").boundingBox())!;
    const cameraBefore = await page.locator(".arch-modal-svg").evaluate(el => (el as SVGSVGElement).viewBox.baseVal.x);
    await page.mouse.move(diagramPane.x + diagramPane.width * .7, diagramPane.y + diagramPane.height / 2);
    await page.mouse.down();
    await page.mouse.move(diagramPane.x + diagramPane.width * .4, diagramPane.y + diagramPane.height / 2, { steps: 6 });
    await page.mouse.up();
    await expect.poll(() => page.locator(".arch-modal-svg").evaluate(el => (el as SVGSVGElement).viewBox.baseVal.x)).toBeGreaterThan(cameraBefore + 50);
    await page.screenshot({ path: test.info().outputPath("readable-architecture.png") });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await swipeBoard(page, context, "#work");
    await expect(page.locator("#work .mobile-board-count")).toHaveText("3 / 4");
    await expect(film).toHaveAttribute("data-card-motion", "settled");
  });

  test("fits all Silicon to Fleet text and retains the complete scene", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/#journey");
    await page.evaluate(() => document.fonts.ready);
    await show(page, "#journey");
    await expect(page.locator("#journey canvas")).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(2000);
    const slides = page.locator("#journey .mobile-board-slide");
    for (let index = 0; index < 7; index++) {
      await page.locator("#journey .mobile-board-viewport").evaluate((el, index) => {
        el.scrollTo({ left: (el.children[index] as HTMLElement).offsetLeft, behavior: "instant" });
      }, index);
      await expect(page.locator("#journey .mobile-board-count")).toHaveText(`${index + 1} / 7`);
      expect(await slides.nth(index).evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
      if ([0, 5, 6].includes(index)) {
        await page.waitForTimeout(2000);
        await page.screenshot({ path: test.info().outputPath(`silicon-stage-${index}.png`) });
      }
    }
  });

  test("scrolling the terminal body advances all five consoles and resumes after a tab jump", async ({ page, context }) => {
    test.setTimeout(90_000);
    await page.goto("/#skills");
    await seek(page, ".terminal-scroll-section", .2 + .8 * .8 / 5);
    const active = page.locator(".terminal-tab[aria-selected=true]");
    await expect(active).toHaveAttribute("aria-label", TERMINAL_COMMANDS[0].tabTitle);
    const distance = await page.locator(".terminal-scroll-section").evaluate(el => (el.clientHeight - innerHeight) * .8 / 5);
    const body = page.locator(".terminal-body");
    for (let index = 1; index < 5; index++) {
      const bounds = (await body.boundingBox())!;
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      await page.mouse.wheel(0, Math.ceil(distance / .55));
      await expect(active).toHaveAttribute("aria-label", TERMINAL_COMMANDS[index].tabTitle);
    }
    await page.screenshot({ path: test.info().outputPath("terminal-final-console.png") });
    await page.getByRole("tab", { name: TERMINAL_COMMANDS[2].tabTitle }).click();
    await expect(active).toHaveAttribute("aria-label", TERMINAL_COMMANDS[2].tabTitle);
    const bounds = (await body.boundingBox())!;
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.wheel(0, Math.ceil(distance / .55));
    await expect(active).toHaveAttribute("aria-label", TERMINAL_COMMANDS[3].tabTitle);

    await page.setViewportSize({ width: 320, height: 568 });
    await seek(page, ".terminal-scroll-section", .2 + .8 * .8 / 5);
    await expect(active).toHaveAttribute("aria-label", TERMINAL_COMMANDS[0].tabTitle);
    const compact = (await body.boundingBox())!;
    const pageY = await page.evaluate(() => scrollY);
    const cdp = await context.newCDPSession(page);
    const points = (y: number) => [{ x: compact.x + compact.width / 2, y, radiusX: 1, radiusY: 1, force: 1, id: 1 }];
    const start = compact.y + compact.height * .8;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: points(start) });
    for (const delta of [40, 80, 120, 160, 200]) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: points(start - delta) });
      await page.waitForTimeout(30);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await cdp.detach();
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(pageY + 90);
    expect(await page.evaluate(() => scrollY) - pageY).toBeLessThan(140);
    await expect(active).toHaveAttribute("aria-label", TERMINAL_COMMANDS[0].tabTitle);
    await page.mouse.move(compact.x + compact.width / 2, compact.y + compact.height / 2);
    await page.mouse.wheel(0, 100);
    await expect(active).toHaveAttribute("aria-label", TERMINAL_COMMANDS[1].tabTitle);
  });
});
