import { test, expect, type Page } from "@playwright/test";
import { STAGE_STARTS } from "../src/scene/career/career-timeline.ts";

async function seek(page: Page, selector: string, progress: number) {
  await page.locator(selector).evaluate((element, t) => window.scrollTo({
    top: scrollY + element.getBoundingClientRect().top + (element.clientHeight - innerHeight) * t,
    behavior: "instant",
  }), progress);
}

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
  test.describe(`Mobile animation chapters at ${viewport.width}px`, () => {
    test.use({ viewport, isMobile: true, hasTouch: true });

    test("keeps the career film and role text synchronized while scrolling", async ({ page }) => {
      test.setTimeout(120_000);
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto("/#hero");
      await expect(page.locator(".hero-mobile-art canvas")).toBeVisible({ timeout: 60_000 });
      const hero = (await page.locator("#hero").boundingBox())!;
      expect(hero.height).toBeLessThanOrEqual(viewport.height - 55);
      const introduction = page.getByLabel("Introduction and links");
      expect(await introduction.evaluate(el => el.clientHeight)).toBeGreaterThan(44);
      await page.screenshot({ path: test.info().outputPath("opening-phone.png") });
      await seek(page, "#career", 0.1);
      await expect(page.locator(".career-canvas canvas")).toBeVisible({ timeout: 60_000 });
      const scene = (await page.locator(".career-screen").boundingBox())!;
      const copy = (await page.locator(".career-column").boundingBox())!;
      expect(scene.y).toBeGreaterThanOrEqual(56);
      expect(scene.y + scene.height).toBeLessThanOrEqual(copy.y);
      expect(scene.height).toBeLessThan(copy.height * .65);
      expect(copy.y + copy.height).toBeLessThanOrEqual(viewport.height);
      const roles = page.getByLabel("Career role details");
      expect(await roles.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
      const pageY = await page.evaluate(() => scrollY);
      const before = await roles.evaluate(el => el.scrollTop);
      const pane = (await roles.boundingBox())!;
      await page.mouse.move(pane.x + pane.width / 2, pane.y + pane.height / 2);
      await page.mouse.wheel(0, viewport.height * .3);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(pageY + 50);
      await expect.poll(() => roles.evaluate(el => el.scrollTop)).toBeGreaterThan(before + 20);

      for (const stage of [1, 2, 3, 4, 0]) {
        const button = page.getByRole("navigation", { name: "Career evolution stages" }).getByRole("button").nth(stage);
        await button.click();
        // A newly shown stage compiles its first shaders on software WebGL.
        await expect(button).toHaveAttribute("aria-current", "step", { timeout: 25_000 });
        await expect(page.locator("#career")).toHaveAttribute("data-career-stage", String(stage));
      }
      await seek(page, "#career", STAGE_STARTS[2] + (STAGE_STARTS[3] - STAGE_STARTS[2]) * 0.65);
      await expect(page.locator("#career")).toHaveAttribute("data-career-stage", "2");
      await page.waitForTimeout(1500);
      await page.screenshot({ path: test.info().outputPath("career-phone.png") });
      expect(errors).toEqual([]);
    });

    test("finishes the landing, keeps the banner visible, and plays the tap poses", async ({ page }) => {
      test.setTimeout(150_000);
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto("/#contact");
      await seek(page, ".aj-section", 0.9);
      await expect(page.locator(".aj-stage")).toHaveAttribute("data-scene-ready", "true", { timeout: 60_000 });
      const banner = page.locator(".contact-banner--animated");
      await expect(banner).toHaveAttribute("data-finale-settled", "true", { timeout: 20_000 });
      const card = page.locator(".contact-frame-wrapper");
      const box = (await card.boundingBox())!;
      const heading = (await page.locator(".contact-journey-heading").boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      expect(box.y).toBeGreaterThan(heading.y + heading.height + 60);
      expect(box.y + box.height).toBeLessThan(viewport.height);
      expect(await card.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
      await page.screenshot({ path: test.info().outputPath("astronaut-landed.png") });
      await page.getByRole("button", { name: "Make him happy" }).click();
      await expect(banner).toHaveAttribute("data-astronaut-mode", "lie");
      await expect(banner).toHaveAttribute("data-astronaut-mode", "dance", { timeout: 10_000 });
      await page.screenshot({ path: test.info().outputPath("astronaut-dancing.png") });
      await expect(banner).toHaveAttribute("data-astronaut-mode", "moonwalk", { timeout: 10_000 });
      await seek(page, ".aj-section", 1);
      await expect(page.locator(".contact-banner-mover")).toHaveCSS("opacity", "1");
      await expect.poll(() => page.evaluate(() => document.querySelector(".footer")!.getBoundingClientRect().top
        - document.querySelector(".contact-banner-mover")!.getBoundingClientRect().bottom)).toBeLessThanOrEqual(40);
      expect(errors).toEqual([]);
    });
  });
}
