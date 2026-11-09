import { test, expect } from "@playwright/test";

test("the reading tour starts gently, ignores hover, and yields to deliberate input", async ({ page }) => {
  test.setTimeout(60000);
  await page.goto("/");
  const control = page.locator(".reading-tour-control");
  // Initial shader preparation can delay timers on software-rendered Chromium.
  await expect(control).toHaveAttribute("data-tour-status", "playing", { timeout: 30000 });
  await page.locator("h1").hover();
  await expect(control).toHaveAttribute("data-tour-status", "playing");
  await expect(control).toHaveAttribute("data-tour-step", "hero");
  await page.mouse.wheel(0, 180);
  await expect(control).toHaveAttribute("data-tour-status", "paused");
  await page.waitForTimeout(1600);
  const held = await page.evaluate(() => scrollY);
  await page.waitForTimeout(1000);
  expect(Math.abs(await page.evaluate(() => scrollY) - held)).toBeLessThan(3);
  await control.click();
  await expect(control).toHaveAttribute("data-tour-status", "playing");
  await page.keyboard.press("Escape");
  await expect(control).toHaveAttribute("data-tour-status", "paused");
});

test("mobile tour reads each board, swipes, pauses, and survives a layout change", async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install();
  await page.goto("/#approach");
  const control = page.locator(".reading-tour-control");
  await expect(control).toHaveAttribute("data-tour-status", "paused", { timeout: 30000 });
  await page.locator("#approach").evaluate(element => element.scrollIntoView({ block: "start", behavior: "instant" }));
  await page.clock.runFor(500);
  await control.click();
  await page.clock.runFor(22000);
  await expect(page.locator("#approach .mobile-board-count")).toHaveText("1 / 4");
  await page.clock.runFor(25000);
  await expect(page.locator("#approach .mobile-board-count")).toHaveText("2 / 4");
  await expect(control).toHaveAttribute("data-tour-status", "playing");
  const step = await control.getAttribute("data-tour-step");
  await page.evaluate(() => Object.defineProperty(document, "hidden", { configurable: true, get: () => true }));
  await page.clock.runFor(40000);
  await expect(control).toHaveAttribute("data-tour-step", step!);
  await page.evaluate(() => Object.defineProperty(document, "hidden", { configurable: true, get: () => false }));
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.clock.runFor(1500);
  await expect(control).toHaveAttribute("data-tour-step", step!);
  await expect(control).toHaveAttribute("data-tour-status", "playing");
  await page.keyboard.press("Tab");
  await expect(control).toHaveAttribute("data-tour-status", "paused");
});

test("reduced motion keeps the tour opt-in and mobile controls available", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#services");
  const control = page.locator(".reading-tour-control");
  await expect(control).toHaveAttribute("data-tour-status", "ready");
  const count = page.locator("#services .mobile-board-count");
  await page.locator("#services").getByRole("button", { name: "Next board" }).click();
  await expect(count).toHaveText("2 / 6");
  await control.click();
  await expect(control).toHaveAttribute("data-tour-status", "playing");
  await control.click();
  await expect(control).toHaveAttribute("data-tour-status", "paused");
});
