import { test, expect } from "@playwright/test";

for (const touch of [false, true]) {
  test(`astronaut invitation responds to ${touch ? "touch" : "hover"} without opening another page`, async ({ browser, browserName, baseURL }) => {
    const context = await browser.newContext({
      viewport: touch ? { width: 1024, height: 1000 } : { width: 1440, height: 1000 },
      hasTouch: touch, isMobile: touch && browserName !== "firefox",
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    try {
      await page.goto(`${baseURL}/#contact`);
      await page.locator(".aj-section").evaluate(element => element.scrollIntoView({ behavior: "instant" }));
      await expect(page.locator(".aj-stage")).toHaveAttribute("data-scene-ready", "true", { timeout: 30000 });
      await page.locator(".aj-section").evaluate(element => {
        scrollTo({ top: scrollY + element.getBoundingClientRect().top + (element.clientHeight - innerHeight) * 0.95, behavior: "instant" });
      });
      const banner = page.locator(".contact-banner");
      await expect(banner).toHaveAttribute("data-finale-settled", "true", { timeout: 10000 });
      await expect(page.locator(".astronaut-invitation")).toBeInViewport();
      if (touch) await page.getByRole("button", { name: "Make him happy" }).tap();
      else await page.locator("#contact .contact-main-btn").hover();
      await expect(banner).toHaveAttribute("data-astronaut-mode", "dance", { timeout: 6000 });
      expect(context.pages()).toHaveLength(1);
      await expect(page).toHaveURL(/#contact$/);
      const bottom = await page.locator(".assurance-item").last().evaluate(element => element.getBoundingClientRect().bottom);
      expect(bottom).toBeLessThanOrEqual(1000);
      expect(errors).toEqual([]);
      await page.screenshot({ path: test.info().outputPath(`collaboration-${touch ? "touch" : "hover"}.png`) });
    } finally {
      await context.close();
    }
  });
}
