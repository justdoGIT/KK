import { test, expect } from "@playwright/test";

test("scrolls every industrial card down and up without invisible cards intercepting input", async ({ page, context }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#visual-lab");
  await page.locator("#visual-lab").evaluate(el => scrollTo({ top: scrollY + el.getBoundingClientRect().top - 56, behavior: "instant" }));
  await expect.poll(() => page.locator("#visual-lab").evaluate(el => Number(getComputedStyle(el.closest(".reveal")!).opacity)), { timeout: 25_000 }).toBe(1);
  const carousel = page.locator("#visual-lab .mobile-board-carousel");
  const rail = carousel.locator(".mobile-board-viewport");
  const pageY = await page.evaluate(() => scrollY);
  for (let index = 0; index < 6; index++) {
    await expect(rail).toHaveAttribute("data-card-motion", "settled");
    const front = carousel.locator(".mobile-board-front").nth(index);
    await expect(front).not.toHaveAttribute("inert");
    const box = (await front.boundingBox())!;
    expect(await front.evaluate(el => el.contains(document.elementFromPoint(
      el.getBoundingClientRect().x + el.clientWidth / 2, el.getBoundingClientRect().y + 100)))).toBe(true);
    const overflow = await front.evaluate(el => el.scrollHeight - el.clientHeight);
    expect(overflow).toBeGreaterThan(20);
    await page.mouse.move(box.x + box.width / 2, box.y + 100);
    await page.mouse.wheel(0, 1200);
    await expect.poll(() => front.evaluate(el => el.scrollTop)).toBeGreaterThan(overflow - 2);
    await expect(front.locator(".showcase-action-link")).toBeInViewport({ ratio: 1 });
    await page.mouse.wheel(0, -1200);
    await expect.poll(() => front.evaluate(el => el.scrollTop)).toBe(0);
    if (index === 0) {
      const cdp = await context.newCDPSession(page);
      const points = (delta: number) => [{ x: box.x + box.width / 2, y: box.y + box.height * .65 - delta, radiusX: 1, radiusY: 1, force: 1, id: 1 }];
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: points(0) });
      for (const delta of [25, 50, 75, 100, 125]) {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: points(delta) });
        await page.waitForTimeout(40);
      }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await cdp.detach();
      await expect.poll(() => front.evaluate(el => el.scrollTop)).toBeGreaterThan(50);
      await page.mouse.wheel(0, -1200);
      await expect.poll(() => front.evaluate(el => el.scrollTop)).toBe(0);
    }
    expect(await page.evaluate(() => scrollY)).toBe(pageY);
    if (index < 5) {
      await carousel.getByRole("button", { name: "Next board" }).click();
      await expect(carousel.locator(".mobile-board-count")).toHaveText(`${index + 2} / 6`);
    }
  }
});
