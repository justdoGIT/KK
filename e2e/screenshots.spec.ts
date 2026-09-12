import { test } from "@playwright/test";

test("desktop screenshot", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: "screenshots/desktop-full.png",
    fullPage: true,
  });
});

test("mobile screenshot", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: "screenshots/mobile-full.png",
    fullPage: true,
  });
});

test("hero screenshot", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: "screenshots/hero.png",
  });
});

test("case-studies screenshot", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.locator("#work").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: "screenshots/case-studies.png",
  });
});

test("career screenshot", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.locator("#career").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  // Expand first disclosure
  const firstBtn = page.getByRole("button").filter({ hasText: /SYMX/ });
  if (await firstBtn.isVisible()) {
    await firstBtn.click({ force: true });
    await page.waitForTimeout(300);
  }
  await page.screenshot({
    path: "screenshots/career.png",
  });
});
