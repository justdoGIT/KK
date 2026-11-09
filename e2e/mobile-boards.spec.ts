import { test, expect } from "@playwright/test";

const boardSections = [
  "#services", "#journey", "#work", "#visual-lab", "#approach", "#offers", ".skill-domains-section",
];

test.describe("Mobile boards", () => {
  test.use({ viewport: { width: 414, height: 736 }, isMobile: true, hasTouch: true });

  test("fits every board in the screen and swipes sideways without moving the page", async ({ page, context }) => {
    await page.goto("/");
    for (const selector of boardSections) {
      const section = page.locator(selector);
      const carousel = section.getByRole("region", { name: /./ });
      await section.evaluate((element) => element.scrollIntoView({ block: "start", behavior: "instant" }));
      const slides = carousel.locator(".mobile-board-slide");
      await expect.poll(async () => {
        const box = await slides.first().boundingBox();
        return !!box && box.x >= 0 && box.y >= 56 && box.x + box.width <= 414 && box.y + box.height <= 737;
      }).toBe(true);
      const first = (await slides.first().boundingBox())!;
      const pageY = await page.evaluate(() => scrollY);

      if (selector === "#services") {
        const cdp = await context.newCDPSession(page);
        const y = first.y + 60;
        const points = (x: number) => [{ x, y, radiusX: 1, radiusY: 1, force: 1, id: 1 }];
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: points(330) });
        for (const x of [290, 250, 210, 170, 130, 90]) {
          await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: points(x) });
          await page.waitForTimeout(30);
        }
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await cdp.detach();
      } else {
        await carousel.getByRole("button", { name: "Next board" }).click();
      }

      await expect(carousel.locator(".mobile-board-count")).toHaveText(/^2 \/ /);
      await expect.poll(async () => Math.abs((await slides.nth(1).boundingBox())!.x - first.x)).toBeLessThan(2);
      expect(Math.abs((await slides.nth(1).boundingBox())!.y - first.y), selector).toBeLessThan(2);
      expect(Math.abs(await page.evaluate(() => scrollY) - pageY), selector).toBeLessThan(2);
      await carousel.getByRole("button", { name: "Previous board" }).click();
      await expect(carousel.locator(".mobile-board-count")).toHaveText(/^1 \/ /);
    }
  });

  test("keeps cards usable on small phones, rotation, and reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#services");
    const section = page.locator("#services");
    const carousel = section.getByRole("region", { name: "Service domains", exact: true });
    await carousel.getByRole("button", { name: "Next board" }).click();
    await expect(carousel.locator(".mobile-board-count")).toHaveText(/^2 \/ /);

    for (const viewport of [{ width: 320, height: 568 }, { width: 736, height: 414 }, { width: 414, height: 736 }]) {
      await page.setViewportSize(viewport);
      await section.evaluate((element) => element.scrollIntoView({ block: "start", behavior: "instant" }));
      await expect(carousel.locator(".mobile-board-count")).toHaveText(/^2 \/ /);
      await expect.poll(async () => {
        const box = await carousel.locator(".mobile-board-slide").nth(1).boundingBox();
        return !!box && box.x >= 0 && box.y >= 56 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1;
      }).toBe(true);
    }

    const slide = carousel.locator(".mobile-board-slide").nth(1);
    expect(await slide.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
    await slide.evaluate((element) => { element.scrollTop = element.scrollHeight; });
    expect(await slide.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    const lastDetail = (await slide.locator(".service-deliv-pill").last().boundingBox())!;
    const box = (await slide.boundingBox())!;
    expect(lastDetail.y + lastDetail.height).toBeLessThanOrEqual(box.y + box.height);
  });
});

test("retains the desktop board layouts", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".mobile-board-carousel")).toHaveCount(0);
  await expect(page.locator("#services")).toHaveClass(/services-throw/);
  await expect(page.locator("#work .lusion-cards-stage")).toHaveCount(1);
  await expect(page.locator(".systems-gallery-grid")).toHaveCSS("display", "grid");
  await expect(page.locator(".offers-grid")).toHaveCSS("display", "grid");
  await expect(page.locator(".skill-domains-section")).toHaveClass(/skill-domains-pinned/);
});
