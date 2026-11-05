import { test, expect, type Page } from "@playwright/test";
import { TERMINAL_COMMANDS } from "../src/content/terminal.ts";

async function revealTerminal(page: Page) {
  await page.goto("/");
  await page.locator(".terminal-scroll-section").evaluate((element) => {
    const top = element.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + (element.clientHeight - innerHeight) * 0.32, behavior: "instant" });
  });
  await expect(page.locator(".interactive-terminal-wrapper")).toHaveCSS("opacity", "1");
}

test.describe("Mobile terminal output", () => {
  test.use({ viewport: { width: 414, height: 736 }, isMobile: true, hasTouch: true });

  test("shows every tab's complete transcript and keeps the controls in frame", async ({ page }) => {
    await revealTerminal(page);
    const panel = page.getByRole("tabpanel");

    for (const command of TERMINAL_COMMANDS) {
      await page.getByRole("tab", { name: command.tabTitle, exact: true }).click();
      await expect(panel.locator(".terminal-output-line")).toHaveText(command.output, { useInnerText: false });
      await expect(panel.locator(".prompt-typed-text")).toHaveText(command.command);
      await expect.poll(() => panel.evaluate((element) => element.scrollTop)).toBe(0);
      expect(await panel.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

      await panel.evaluate((element) => { element.scrollTop = element.scrollHeight; });
      await expect(panel.locator(".terminal-output-line").last()).toBeInViewport({ ratio: 1 });
      await expect(panel.locator(".terminal-exit-code")).toBeInViewport({ ratio: 1 });
      await expect(page.locator(".terminal-titlebar")).toBeInViewport({ ratio: 1 });
      await expect(page.locator(".terminal-footer-bar")).toBeInViewport({ ratio: 1 });
    }

    // The scroll script is on the first command at this page position. A
    // selected final tab must not revert when the old four-second timer ends.
    await page.waitForTimeout(4500);
    await expect(page.getByRole("tab", { name: "fleet-runtime.sh", exact: true })).toHaveAttribute("aria-selected", "true");
    await expect(panel.locator(".terminal-output-line")).toHaveCount(TERMINAL_COMMANDS[4].output.length);

    await page.getByRole("tab", { name: "skills-languages.sh", exact: true }).click();
    const heightBefore = await panel.evaluate((element) => element.clientHeight);
    await page.getByRole("button", { name: "Expand terminal", exact: true }).click();
    await expect.poll(() => panel.evaluate((element) => element.clientHeight)).toBeGreaterThan(heightBefore + 100);
    await expect(page.locator(".terminal-footer-bar")).toBeInViewport({ ratio: 1 });
    await page.getByRole("button", { name: "Restore terminal size", exact: true }).click();
  });

  test("scrolls the transcript with touch and wheel without advancing the page", async ({ page, context }) => {
    await revealTerminal(page);
    await page.getByRole("tab", { name: "platforms-silicon.sh", exact: true }).click();
    const panel = page.getByRole("tabpanel");
    const before = await page.evaluate(() => scrollY);
    const box = (await panel.boundingBox())!;
    const cdp = await context.newCDPSession(page);
    const points = (y: number) => [{ x: box.x + box.width / 2, y, radiusX: 1, radiusY: 1, force: 1, id: 1 }];
    const start = box.y + box.height - 30;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: points(start) });
    for (const distance of [40, 80, 120, 160, 200]) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: points(start - distance) });
      await page.waitForTimeout(30);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => panel.evaluate((element) => element.scrollTop)).toBeGreaterThan(50);
    await page.waitForTimeout(900);
    expect(Math.abs(await page.evaluate(() => scrollY) - before)).toBeLessThan(2);

    await panel.evaluate((element) => { element.scrollTop = element.scrollHeight; });
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(600);
    expect(Math.abs(await page.evaluate(() => scrollY) - before)).toBeLessThan(2);
    await expect(page.getByRole("tab", { name: "platforms-silicon.sh", exact: true })).toHaveAttribute("aria-selected", "true");
    await cdp.detach();
  });

  test("fits a smaller phone and landscape with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    for (const viewport of [{ width: 320, height: 568 }, { width: 736, height: 414 }]) {
      await page.setViewportSize(viewport);
      await page.locator(".terminal-scroll-section").evaluate((element) => {
        scrollTo({ top: element.getBoundingClientRect().top + scrollY - 64, behavior: "instant" });
      });
      await page.getByRole("tab", { name: "skills-languages.sh", exact: true }).click();
      const panel = page.getByRole("tabpanel");
      expect(await panel.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      await panel.focus();
      await page.keyboard.press("Control+End");
      await expect(panel.locator(".terminal-exit-code")).toBeInViewport({ ratio: 1 });
      await expect(page.locator(".terminal-footer-bar")).toBeInViewport({ ratio: 1 });
      await expect(page.getByRole("button", { name: "Copy", exact: true })).toBeInViewport({ ratio: 1 });
    }
  });
});

test("keeps the desktop terminal size and exposes the final result for all tabs", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await revealTerminal(page);
  await expect(page.locator(".terminal-window")).toHaveCSS("height", "440px");
  const panel = page.getByRole("tabpanel");
  for (const command of TERMINAL_COMMANDS) {
    await page.getByRole("tab", { name: command.tabTitle, exact: true }).click();
    await expect(panel.locator(".terminal-output-line")).toHaveText(command.output, { useInnerText: false });
    await panel.evaluate((element) => { element.scrollTop = element.scrollHeight; });
    await expect(panel.locator(".terminal-exit-code")).toBeInViewport({ ratio: 0.999 });
    await expect(page.locator(".terminal-footer-bar")).toBeInViewport({ ratio: 1 });
  }
});
