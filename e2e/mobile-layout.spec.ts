import { test, expect, devices } from "@playwright/test";

/*
 * Phones and short screens: the page must not scroll sideways, text must not be
 * cut by the screen edge or by a pinned stage, and touch controls must be at
 * least 44px. Everything is measured from layout (getBoundingClientRect) at
 * evenly spaced scroll positions.
 *
 * The device profiles run in Chromium with each device's viewport, pixel ratio
 * and touch input, so the same layout rules (including `pointer: coarse`) apply;
 * WebKit's text metrics differ slightly and are covered by the manual audit.
 */

const MAX_STOPS = 60;

// defaultBrowserType would force a new worker and cannot be set inside a describe.
function phone(name: string) {
  return Object.fromEntries(
    Object.entries(devices[name]).filter(([key]) => key !== "defaultBrowserType"),
  );
}

const PROFILES = [
  { name: "iPhone SE (320x568)", options: phone("iPhone SE") },
  { name: "iPhone 13 (390x664)", options: phone("iPhone 13") },
  { name: "iPhone 13 landscape (750x342)", options: phone("iPhone 13 landscape") },
  { name: "Pixel 7 (412x839)", options: phone("Pixel 7") },
  { name: "short desktop (1024x500)", options: { viewport: { width: 1024, height: 500 } } },
];

// Runs in the page. Reads layout only; returns one string per problem found.
function probeLayout(): string[] {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const findings: string[] = [];
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  const path = (element: Element) => {
    const parts: string[] = [];
    let node: Element | null = element;
    for (let depth = 0; depth < 4 && node; depth += 1, node = node.parentElement) {
      let part = node.tagName.toLowerCase();
      if (node.id) part += `#${node.id}`;
      else if (node.classList.length) part += `.${[...node.classList].slice(0, 2).join(".")}`;
      parts.unshift(part);
    }
    return parts.join(">");
  };
  const ownText = (element: Element) =>
    [...element.childNodes]
      .filter((child) => child.nodeType === Node.TEXT_NODE)
      .map((child) => child.textContent?.trim() ?? "")
      .join(" ")
      .trim();
  const shown = (element: Element, rect: DOMRect) => {
    if (rect.width <= 0 || rect.height <= 0) return false;
    for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      if (
        style.visibility === "hidden" ||
        style.display === "none" ||
        parseFloat(style.opacity) <= 0.05
      ) {
        return false;
      }
    }
    return true;
  };

  const root = document.documentElement;
  if (root.scrollWidth > root.clientWidth + 1) {
    findings.push(`page scrolls sideways: scrollWidth ${root.scrollWidth} > ${root.clientWidth}`);
  }

  const all = [...document.body.querySelectorAll("*")];
  const stages: { element: Element; rect: DOMRect }[] = [];
  for (const element of all) {
    const rect = element.getBoundingClientRect();
    if (!shown(element, rect)) continue;
    const style = getComputedStyle(element);
    const pinned = style.position === "sticky" || style.position === "fixed";
    if (pinned && rect.height >= vh * 0.6 && rect.top <= 2 && rect.bottom > vh * 0.3) {
      stages.push({ element, rect });
    }
  }
  const navHeight = document.querySelector(".nav-bar")?.getBoundingClientRect().height ?? 0;

  for (const element of all) {
    const rect = element.getBoundingClientRect();
    if (!shown(element, rect)) continue;
    if (!(rect.bottom > 0 && rect.top < vh && rect.right > -vw && rect.left < vw * 2)) continue;
    const text = ownText(element);

    const tag = element.tagName.toLowerCase();
    const interactive =
      (tag === "a" && element.hasAttribute("href")) ||
      ["button", "summary", "select", "textarea", "input"].includes(tag) ||
      element.getAttribute("role") === "button" ||
      (element.hasAttribute("tabindex") && element.getAttribute("tabindex") !== "-1");
    if (coarse && interactive && rect.left < vw && rect.right > 0) {
      const label = (element.getAttribute("aria-label") || text || element.textContent || "").trim();
      if (Math.min(rect.width, rect.height) < 44) {
        findings.push(
          `touch target under 44px: ${path(element)} ${Math.round(rect.width)}x${Math.round(rect.height)} "${label.slice(0, 24)}"`,
        );
      }
    }
  }

  for (const { element: stage, rect: stageRect } of stages) {
    const bottom = Math.min(stageRect.bottom, vh);
    const top = Math.max(stageRect.top, navHeight);
    for (const element of stage.querySelectorAll("*")) {
      const rect = element.getBoundingClientRect();
      if (!shown(element, rect) || ownText(element).length < 2) continue;
      if (rect.right <= 0 || rect.left >= vw) continue;
      const where = `${path(stage)} :: ${path(element)}`;
      if (rect.top < vh && rect.bottom > bottom + 2 && rect.top < bottom) {
        findings.push(`text clipped by the stage bottom: ${where} by ${Math.round(rect.bottom - bottom)}px`);
      }
      if (rect.bottom > 0 && rect.top < top - 2 && rect.bottom > top && navHeight > 0 && rect.top >= -4) {
        findings.push(`text hidden under the nav: ${where} by ${Math.round(top - rect.top)}px`);
      }
    }
  }
  return findings;
}

test.describe("Phone and short-screen layout", () => {
  for (const profile of PROFILES) {
    test.describe(profile.name, () => {
      test.use(profile.options);

      test("nothing overflows, clips, or falls under the size floors", async ({ page }) => {
        test.setTimeout(240_000);
        await page.goto("/", { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(2500);

        // Without WebGL and enhanced motion the pinned layouts never mount and
        // this test would pass without exercising them.
        await expect(page.locator(".aj-section")).toHaveCount(1);

        const { height, viewport } = await page.evaluate(() => ({
          height: document.documentElement.scrollHeight,
          viewport: window.innerHeight,
        }));
        const stride = Math.max(viewport * 0.9, height / MAX_STOPS);
        const found = new Map<string, number>();
        for (let y = 0; y < height - viewport + stride; y += stride) {
          await page.evaluate((top) => window.scrollTo(0, top), Math.round(y));
          await page.waitForTimeout(900);
          for (const finding of await page.evaluate(probeLayout)) {
            if (!found.has(finding)) found.set(finding, Math.round(y));
          }
        }

        expect(
          [...found].map(([finding, y]) => `${finding} (first at y=${y})`),
          "layout problems",
        ).toEqual([]);
      });
    });
  }
});
