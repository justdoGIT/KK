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
