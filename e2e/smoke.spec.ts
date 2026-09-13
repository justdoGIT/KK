import { test, expect } from "@playwright/test";

test.describe("Portfolio smoke tests", () => {
  test("hero heading is visible", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1 }),
    ).toBeVisible();
  });

  test("skip link is present and points to main", async ({ page }) => {
    await page.goto("/");
    const skip = page.getByText("Skip to main content");
    await expect(skip).toHaveAttribute("href", "#main");
  });

  test("all sections are present", async ({ page }) => {
    await page.goto("/");
    for (const label of [
      "Hero",
      "Services",
      "Systems journey",
      "Case studies",
      "Services and offers",
      "Career timeline",
      "Skill matrix",
      "Contact",
    ]) {
      await expect(page.getByLabel(label, { exact: true })).toBeVisible();
    }
  });

  test("keyboard navigation reaches skip link first", async ({ page }) => {
    await page.goto("/");
    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toHaveAttribute("href", "#main");
  });

  test("career timeline disclosure expands", async ({ page }) => {
    await page.goto("/");
    const firstButton = page
      .getByRole("button")
      .filter({ hasText: /SYMX\.AI/ });
    await firstButton.click();
    await expect(
      page.locator(".disclosure-panel").first(),
    ).toBeVisible();
    await expect(
      page.locator(".disclosure-panel").first().getByText(/Watchdog/),
    ).toBeVisible();
  });

  test("mobile navigation opens and closes", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Open navigation menu" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(
      page.getByRole("button", { name: "Close navigation menu" }),
    ).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("link", { name: "Services", exact: true }).click();
    await expect(page).toHaveURL(/#services$/);
  });

  test("case study visual responds to pointer movement", async ({ page }) => {
    await page.goto("/");
    const visual = page.locator(".interactive-visual").first();
    await visual.hover({ position: { x: 30, y: 30 } });
    await expect(visual).toHaveClass(/interactive-visual-active/);
    await expect(visual.getByText("Pointer signal detected")).toBeVisible();
  });

  test("publication metadata and repository-controlled visual assets load", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
      "href",
      "./favicon.svg",
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      "./og-preview.svg",
    );

    const favicon = await page.request.get("./favicon.svg");
    expect(favicon.ok()).toBe(true);
    expect(await favicon.text()).toContain("<svg");

    const preview = await page.request.get("./og-preview.svg");
    expect(preview.ok()).toBe(true);
    expect(await preview.text()).toContain("Kamal Pandey");
  });

  test("no prohibited terms or private paths in rendered HTML", async ({ page }) => {
    await page.goto("/");
    const html = await page.content();
    expect(html.toLowerCase()).not.toContain("grok-build");
    expect(html).not.toContain("/home/miniblues");
  });

  test("external links open in new tab with noreferrer", async ({ page }) => {
    await page.goto("/");
    const githubLinks = page.getByRole("link", { name: "GitHub" });
    const count = await githubLinks.count();
    for (let i = 0; i < count; i++) {
      const link = githubLinks.nth(i);
      const href = await link.getAttribute("href");
      if (href?.startsWith("http")) {
        await expect(link).toHaveAttribute("target", "_blank");
        await expect(link).toHaveAttribute("rel", "noreferrer");
      }
    }
  });
});
