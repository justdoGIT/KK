import { test, expect } from "@playwright/test";
import { createServer, type ViteDevServer } from "vite";

test.describe("Development runtime", () => {
  let server: ViteDevServer;
  let url: string;

  test.beforeAll(async () => {
    server = await createServer({
      server: { host: "127.0.0.1", port: 0 },
      logLevel: "error",
    });
    await server.listen();
    const address = server.resolvedUrls?.local[0];
    if (!address)
      throw new Error("Development server did not expose a local URL");
    url = address;
  });

  test.afterAll(async () => {
    await server?.close();
  });

  test("renders responsive navigation and connects hot reload", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const messages: string[] = [];
    page.on("console", (message) => messages.push(message.text()));
    await page.goto(url);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Open navigation menu",
        includeHidden: true,
      }),
    ).toBeHidden();
    await expect.poll(() => messages.includes("[vite] connected.")).toBe(true);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await page.getByRole("link", { name: "Services", exact: true }).click();
    await expect(page).toHaveURL(/#services$/);
    await expect(
      page.getByRole("button", { name: "Open navigation menu" }),
    ).toHaveAttribute("aria-expanded", "false");
  });
});

test("production limits connections to same-origin models and blocks injected styles", async ({ page }) => {
  await page.goto("/");
  const [sameOriginModel, crossOrigin] = await page.evaluate(async () => {
    const attempt = async (url: string) => {
      try {
        return (await fetch(url)).ok;
      } catch {
        return false;
      }
    };
    return [
      await attempt("./models/characters/robot-expressive.glb"),
      await attempt("https://example.com/"),
    ];
  });
  expect(sameOriginModel).toBe(true);
  expect(crossOrigin).toBe(false);

  await page.evaluate(() => {
    const style = document.createElement("style");
    style.textContent = "#main { display: none !important; }";
    document.head.append(style);
  });
  await expect(page.getByRole("main")).toBeVisible();
});

test("guided playback resumes after an upward touch gesture", async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  try {
    await page.goto("/");
    const section = page.locator(".terminal-scroll-section");
    const target = await section.evaluate((element) => {
      const top = element.getBoundingClientRect().top + scrollY;
      return top + (element.clientHeight - innerHeight) * 0.25;
    });
    await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), target);
    await expect.poll(() => page.evaluate((y) => Math.abs(scrollY - y), target)).toBeLessThan(3);

    const cdp = await context.newCDPSession(page);
    const point = (y: number) => [{ x: 640, y, radiusX: 1, radiusY: 1, force: 1, id: 1 }];
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: point(600) });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: point(520) });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: point(440) });
    await page.waitForTimeout(350);
    const held = await page.evaluate(() => scrollY);
    await page.waitForTimeout(300);
    expect(Math.abs(await page.evaluate(() => scrollY) - held)).toBeLessThanOrEqual(2);

    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => page.evaluate(() => scrollY), { timeout: 3000 }).toBeGreaterThan(held + 20);
    await cdp.detach();
  } finally {
    await context.close();
  }
});
