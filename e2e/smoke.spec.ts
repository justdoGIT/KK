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
    await expect(page.locator(".aj-end")).toHaveCount(0);
    // After the break the stage shows the site's background, not a black void.
    await expect
      .poll(async () => page.locator(".aj-theme").evaluate((el) => Number(el.style.opacity)), { timeout: 20_000 })
      .toBe(1);
  });

  test("keeps one astronaut through landing, greeting, and playful banner finale", async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const journey = page.locator(".aj-section");
    const banner = journey.locator(".contact-banner");
    const heading = journey.locator(".contact-journey-heading");
    const scrollFinaleTo = async (progress: number) => {
      await journey.evaluate((element, value) => {
        const top = window.scrollY + element.getBoundingClientRect().top;
        window.scrollTo({
          top: top + (element.offsetHeight - window.innerHeight) * (0.65 + value * 0.35),
          behavior: "instant",
        });
      }, progress);
    };

    await scrollFinaleTo(0.08);
    await expect(banner).toHaveAttribute("data-astronaut-mode", "landing");
    const heroCanvas = await journey.locator(".aj-hero canvas").elementHandle();
    expect(heroCanvas).not.toBeNull();
    await expect(journey.locator(".contact-frame-wrapper")).toHaveCount(1);

    await scrollFinaleTo(0.32);
    await expect(banner).toHaveAttribute("data-astronaut-mode", "stand");
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText(/Let.s innovate together/i);
    // Idling during the greeting must not replace the wave with a rest pose.
    await page.waitForTimeout(4500);
    await expect(banner).toHaveAttribute("data-astronaut-mode", "stand");

    await scrollFinaleTo(0.9);
    await expect(banner).toHaveAttribute("data-astronaut-mode", "sit");
    expect(await heroCanvas!.evaluate((node) => node === document.querySelector(".aj-hero canvas"))).toBe(true);
    const card = await journey.locator(".contact-frame-wrapper").boundingBox();
    expect(card!.y).toBeGreaterThan(50);
    expect(card!.y + card!.height).toBeLessThanOrEqual(900);
    const start = banner.getByRole("link", { name: /Start a Conversation/ });
    await start.hover();
    await expect(banner).toHaveAttribute("data-astronaut-mode", "dance");
    const github = banner.getByRole("link", { name: /View GitHub Repositories/ });
    await github.dispatchEvent("pointerdown");
    await expect(banner).toHaveAttribute("data-astronaut-mode", "wait");
  });

  test("cruises the journey automatically after a downward gesture", async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    const journey = page.locator(".aj-section");
    const stage = page.locator(".aj-stage");

    await journey.evaluate((element) => {
      const top = window.scrollY + element.getBoundingClientRect().top;
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
      .not.toBe("cardShow");
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
      { progress: 0.86, stage: "4", codename: "LAUNCH", company: "SYMX.AI" },
    ] as const;

    const sectionTop = await section.evaluate((element) => window.scrollY + element.getBoundingClientRect().top);
    for (const expected of stages) {
      await section.evaluate((element, { base, progress }) => {
        const scrollable = element.offsetHeight - window.innerHeight;
        window.scrollTo({ top: base + scrollable * progress, behavior: "instant" as ScrollBehavior });
      }, { base: sectionTop, progress: expected.progress });
      await expect(section).toHaveAttribute("data-career-stage", expected.stage);
      await expect(page.locator(".career-screen-codename")).toContainText(expected.codename);
      await expect(page.locator(".career-entry.is-active")).toContainText(expected.company);
    }

    await section.evaluate((element, base) => {
      const scrollable = element.offsetHeight - window.innerHeight;
      window.scrollTo({ top: base + scrollable * 0.985, behavior: "instant" as ScrollBehavior });
    }, sectionTop);
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

  test("keeps card choreography usable on short wide screens", async ({ page }) => {
    await page.setViewportSize({ width: 1381, height: 367 });
    await page.goto("/");

    const caseStudies = page.getByLabel("Case studies");
    await expect(caseStudies).not.toHaveClass(/is-static/);

    const serviceCard = page.getByLabel(/Firmware & Board Bring-Up service details/i);
    const overflow = await serviceCard.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        scrollable: element.scrollHeight > element.clientHeight,
        overflowY: style.overflowY,
      };
    });
    expect(overflow).toEqual({ scrollable: true, overflowY: "auto" });
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
