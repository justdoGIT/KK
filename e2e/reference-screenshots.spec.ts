import { test } from "@playwright/test";

test("visual lab screenshot", async ({ page }) => {
  await page.goto("/");
  await page.locator("#visual-lab").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: "screenshots/visual-lab.png" });
});

test("process timeline screenshot", async ({ page }) => {
  await page.goto("/");
  await page.locator("#approach").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: "screenshots/process-timeline.png" });
});
