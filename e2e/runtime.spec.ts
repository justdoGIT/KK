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

test("production blocks connections and injected styles", async ({ page }) => {
  await page.goto("/");
  const connectionAllowed = await page.evaluate(async () => {
    try {
      await fetch("/favicon.svg");
      return true;
    } catch {
      return false;
    }
  });
  expect(connectionAllowed).toBe(false);

  await page.evaluate(() => {
    const style = document.createElement("style");
    style.textContent = "#main { display: none !important; }";
    document.head.append(style);
  });
  await expect(page.getByRole("main")).toBeVisible();
});
