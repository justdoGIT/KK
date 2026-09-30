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
      "Visual project lab",
      "Working approach",
      "Career timeline",
      "Skill matrix",
      "Contact",
    ]) {
      await expect(page.getByLabel(label, { exact: true })).toBeVisible();
    }
  });

  test("reveals terminal and skill domains after the career timeline", async ({ page }) => {
    await page.goto("/");
    const skills = page.locator("#skills");
    await skills.evaluate((element) => {
      window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY + 1000);
    });
    await expect(
      page.getByRole("heading", { name: "Interactive System Console & Toolchains" }),
    ).toBeVisible();

    const domains = page.locator(".skill-domains-section");
    await domains.evaluate((element) => {
      window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY + 1000);
    });
    await expect(page.getByRole("tablist", { name: "Skill categories" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Languages & Core" })).toBeVisible();
  });

  test("tracks revealed skill domains in the filter highlights", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    const domains = page.locator(".skill-domains-section");
    await expect(domains).toHaveClass(/skill-domains-pinned/);
    const counter = page.locator(".skill-domains-counter");
    const allDomains = page.getByRole("tab", { name: /^All Domains/ });
    const domainTabs = [
      page.getByRole("tab", { name: /^Languages & Core/ }),
      page.getByRole("tab", { name: /^Processors & SoCs/ }),
      page.getByRole("tab", { name: /^OS & Firmware/ }),
    ];

    const scrollToOpenedCount = async (opened: number) => {
      await domains.evaluate((element, count) => {
        const total = element.querySelectorAll(".skill-card-reveal").length;
        const scrollable = element.offsetHeight - window.innerHeight;
        const progress = ((count + 0.05) / total) * 0.86;
        const top = element.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + scrollable * progress, behavior: "instant" as ScrollBehavior });
      }, opened);
    };

    await scrollToOpenedCount(1);
    await expect(counter).toHaveText("01 / 07");
    await expect(domainTabs[0]).toHaveClass(/is-revealed/);
    await expect(domainTabs[1]).not.toHaveClass(/is-revealed/);
    await expect(allDomains).not.toHaveClass(/active/);

    await scrollToOpenedCount(3);
    await expect(counter).toHaveText("03 / 07");
    for (const tab of domainTabs) {
      await expect(tab).toHaveClass(/is-revealed/);
    }

    await scrollToOpenedCount(7);
    await expect(counter).toHaveText("07 / 07");
    for (const tab of domainTabs) {
      await expect(tab).not.toHaveClass(/is-revealed/);
    }
    await expect(allDomains).toHaveClass(/active/);
  });

  test("stages the 3D astronaut card expansion, tunnel journey, and finale", async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    const journey = page.locator(".aj-section");
    const stage = page.locator(".aj-stage");
    const intro = page.locator(".aj-intro");
    const end = page.locator(".aj-end");

    await expect(stage).toHaveCSS("position", "sticky");
    await expect
      .poll(async () => stage.evaluate((element) => Math.abs(element.getBoundingClientRect().height - window.innerHeight)))
      .toBeLessThan(2);

    const expectPhase = (phase: string) =>
      expect.poll(async () => stage.getAttribute("data-phase"), { timeout: 25_000 }).toBe(phase);

    const scrollJourneyTo = async (progress: number) => {
      await journey.evaluate((element, value) => {
        const scrollable = element.offsetHeight - window.innerHeight;
        let secTop = 0;
        for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) {
          secTop += node.offsetTop;
        }
        window.scrollTo({ top: secTop + scrollable * value, behavior: "instant" as ScrollBehavior });
      }, progress);
      await page.waitForTimeout(150);
    };

    await scrollJourneyTo(0.02);
    await expectPhase("cardShow");
    await expect(intro).toBeVisible();

    await scrollJourneyTo(0.18);
    await expectPhase("title");
    await expect(page.getByText("Step into a new orbit")).toBeVisible();

    await scrollJourneyTo(0.30);
    await expectPhase("blackTunnel");

    await scrollJourneyTo(0.52);
    await expectPhase("frameBreak");

    await scrollJourneyTo(0.86);
    await expectPhase("wait");
    await expect(end).toBeVisible();

    // Close-up wave: the heading pops in the site's display type.
    const heading = page.locator(".aj-end-title");
    await expect(heading).toHaveText(/Let.s innovate together/i);
    await expect.poll(async () => end.evaluate((el) => getComputedStyle(el).opacity), { timeout: 20_000 }).toBe("1");
    await expect(heading).toHaveCSS("font-weight", "800");
    const fonts = await heading.evaluate((el) => [getComputedStyle(el).fontFamily, getComputedStyle(document.body).fontFamily]);
    expect(fonts[0]).toBe(fonts[1]);
    await expect(page.locator(".aj-intro-title")).toHaveCSS("font-weight", "800");
    // After the break the stage shows the site's background, not a black void.
    await expect
      .poll(async () => page.locator(".aj-theme").evaluate((el) => Number(el.style.opacity)), { timeout: 20_000 })
      .toBe(1);
  });

  test("pops the contact banner up and sags it under the landing astronaut", async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const banner = page.locator(".contact-banner");
    const mover = page.locator(".contact-banner-mover");

    // Exactly one banner: the contact card itself is the cuboid's front face.
    await expect(page.locator(".contact-cuboid")).toHaveCount(1);
    await expect(page.locator(".contact-cuboid > .contact-frame-wrapper")).toHaveCount(1);

    const offset = () =>
      mover.evaluate((el) => {
        const match = /translate3d\(0px, (-?[\d.]+)px/.exec(el.style.transform);
        return match ? Number(match[1]) : Number.NaN;
      });

    // Pops up from below before the astronaut has landed.
    await expect.poll(offset, { timeout: 5_000 }).toBeGreaterThan(60);
    await banner.evaluate((el) => {
      const r = el.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + r.top - window.innerHeight * 0.4, behavior: "instant" as ScrollBehavior });
    });
    // Sags well past the old 14px bump on landing, then eases back to rest.
    await expect.poll(offset, { timeout: 30_000 }).toBeGreaterThan(24);
    await expect.poll(offset, { timeout: 30_000 }).toBeLessThan(1);
    await expect(mover).toHaveCSS("opacity", "1");
    // The previous close-up is gone before the lounge astronaut arrives.
    await expect(page.locator(".aj-stage")).toHaveCSS("opacity", "0");
    await expect(page.locator(".contact-lounge canvas")).toHaveCount(1);

    // The top face is visible above the front face: the banner reads as a slab.
    const faces = await page.evaluate(() => {
      const top = document.querySelector(".contact-cuboid-top")?.getBoundingClientRect();
      const front = document.querySelector(".contact-frame-wrapper")?.getBoundingClientRect();
      return top && front ? { depth: front.top - top.top } : null;
    });
    expect(faces?.depth ?? 0).toBeGreaterThan(20);
    await expect(page.getByRole("link", { name: /Start a Conversation/ }).last()).toBeVisible();
  });

  test("cruises the journey automatically after a downward gesture", async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    const journey = page.locator(".aj-section");
    const stage = page.locator(".aj-stage");

    await journey.evaluate((element) => {
      let top = 0;
      for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) {
        top += node.offsetTop;
      }
      window.scrollTo({ top, behavior: "instant" as ScrollBehavior });
    });
    await expect(stage).toHaveAttribute("data-phase", "cardShow");

    // One downward gesture while the pinned card is centred arms the cruise;
    // the journey then advances through its phases without further input.
    await page.waitForTimeout(800);
    await page.mouse.move(720, 500);
    await page.mouse.wheel(0, 120);
    await expect
      .poll(async () => stage.getAttribute("data-phase"), { timeout: 25_000 })
      .toBe("title");
    await expect
      .poll(async () => stage.getAttribute("data-phase"), { timeout: 40_000 })
      .toBe("blackTunnel");
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
    const symxButton = page
      .getByRole("button")
      .filter({ hasText: /SYMX\.AI/ });
    // Activate through the button's keyboard contract: the continuously
    // scrubbing robot timeline can move overlapping cards between frames.
    await symxButton.focus();
    await symxButton.press("Enter");
    await expect(
      page.locator(".disclosure-panel").first(),
    ).toBeVisible();
    await expect(
      page.locator(".disclosure-panel").first().getByText(/Autonomous hardware/),
    ).toBeVisible();
  });

  test("shows every career robot stage and scrubs the active role content", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/");
    const section = page.locator("section#career");
    await section.scrollIntoViewIfNeeded();
    const stages = [
      { progress: 0.12, stage: "0", codename: "WALL FOLLOWER", company: "IFM Engineering" },
      { progress: 0.31, stage: "1", codename: "ROVER", company: "Capgemini" },
      { progress: 0.49, stage: "2", codename: "EDGE AI QUADRUPED", company: "Dozee" },
      { progress: 0.65, stage: "3", codename: "HUMANOID", company: "Vestel International" },
      { progress: 0.86, stage: "4", codename: "TRANSFORMER", company: "SYMX.AI" },
    ] as const;

    for (const expected of stages) {
      await section.evaluate((element, progress) => {
        let top = 0;
        for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) {
          top += node.offsetTop;
        }
        const scrollable = element.offsetHeight - window.innerHeight;
        window.scrollTo({ top: top + scrollable * progress, behavior: "instant" as ScrollBehavior });
      }, expected.progress);
      await expect(section).toHaveAttribute("data-career-stage", expected.stage);
      await expect(page.locator(".career-screen-codename")).toContainText(expected.codename);
      await expect(page.locator(".career-entry.is-active")).toContainText(expected.company);
    }

    await section.evaluate((element) => {
      let top = 0;
      for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) {
        top += node.offsetTop;
      }
      const scrollable = element.offsetHeight - window.innerHeight;
      window.scrollTo({ top: top + scrollable * 0.985, behavior: "instant" as ScrollBehavior });
    });
    await expect
      .poll(async () => Number((await section.getAttribute("data-career-local")) ?? "0"))
      .toBeGreaterThan(0.9);
    await expect
      .poll(async () => page.locator(".career-entries").evaluate((list) => list.scrollTop), { timeout: 10_000 })
      .toBeGreaterThan(20);
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

  test("page journey navigator tracks sections and links to the next stop", async ({ page }) => {
    await page.goto("/");
    const navigator = page.getByRole("complementary", { name: "Page journey" });
    await expect(navigator).toBeVisible();
    await expect(navigator.getByRole("link", { name: "Go to Start" })).toHaveAttribute("aria-current", "step");
    const workLink = navigator.getByRole("link", { name: "Go to Work" });
    await expect(workLink).toHaveAttribute("href", "#work");
    await workLink.click();
    await expect(page).toHaveURL(/#work$/);
    await expect(navigator.getByRole("link", { name: "Go to Lab" })).toBeVisible();
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
