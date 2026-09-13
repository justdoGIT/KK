import { test } from "@playwright/test";

test("story journey screenshot", async ({ page }) => {
  await page.goto("/");
  await page.locator("#journey").scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({ path: "screenshots/story-journey.png" });
});

test("offers screenshot", async ({ page }) => {
  await page.goto("/");
  await page.locator("#offers").scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({ path: "screenshots/offers.png" });
});

test("hover splash screenshot", async ({ page }) => {
  await page.goto("/");
  const visual = page.locator(".interactive-visual").first();
  await visual.scrollIntoViewIfNeeded();
  await visual.hover({ position: { x: 80, y: 50 } });
  await page.waitForTimeout(300);
  await page.screenshot({ path: "screenshots/hover-splash.png" });
});
