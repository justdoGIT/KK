import { test, expect } from "@playwright/test";

// Card text must remain inside its own border, including the final deliverable.
// Exercise the desktop throw threshold, not just the existing phone fallback.
for (const viewport of [
  { width: 1024, height: 720 },
  { width: 1280, height: 800 },
  { width: 1440, height: 1000 },
  { width: 1920, height: 1080 },
]) {
  test(`service details remain readable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const services = page.locator("#services");
    await expect(services.locator("article")).toHaveCount(6);
    await expect.poll(() => services.evaluate((section) => {
      const problems: string[] = [];
      for (const card of section.querySelectorAll<HTMLElement>("article")) {
        if (card.scrollHeight > card.clientHeight + 1) {
          problems.push(`${card.getAttribute("aria-label")}: text exceeds card height`);
        }
      }
      return problems;
    })).toEqual([]);

    if (!(await services.evaluate((section) => section.classList.contains("services-throw")))) {
      for (const card of await services.locator("article").all()) {
        const deliverable = card.locator(".service-deliv-pill").last();
        await deliverable.scrollIntoViewIfNeeded();
        await expect(deliverable).toBeVisible();
        await expect(card).toHaveCSS("position", "static");
        await expect(card.locator(".service-card-side")).toHaveCSS("opacity", "1");
      }
    }
  });
}

test("service readability adapts when the viewport shrinks and grows", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1440 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const services = page.locator("#services");
  await expect(services).toHaveClass(/services-throw/);

  await page.setViewportSize({ width: 1024, height: 720 });
  await expect(services).not.toHaveClass(/services-throw/);
  const finalDeliverable = services.locator("article").last().locator(".service-deliv-pill").last();
  await finalDeliverable.scrollIntoViewIfNeeded();
  await expect(finalDeliverable).toBeInViewport();
  await expect(finalDeliverable).toBeVisible();

  await page.setViewportSize({ width: 1920, height: 1440 });
  await expect(services).toHaveClass(/services-throw/);
  await expect.poll(() => services.locator("article").evaluateAll((cards) =>
    cards.every((card) => card.scrollHeight <= card.clientHeight + 1),
  )).toBe(true);
});
