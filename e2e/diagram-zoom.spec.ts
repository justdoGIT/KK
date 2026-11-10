import { test, expect, type Page } from "@playwright/test";

async function openDiagram(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#work");
  await page.locator("#work").evaluate(el => scrollTo({ top: scrollY + el.getBoundingClientRect().top - 56, behavior: "instant" }));
  await page.locator("#work .deck-mini-diagram-box").first().click();
  await expect(page.getByRole("dialog")).toHaveCSS("opacity", "1");
  await expect(page.locator(".arch-diagram-viewport")).toHaveAttribute("data-zoom", /\d/);
}

async function worldPoint(page: Page, x: number, y: number) {
  return page.locator(".arch-modal-svg").evaluate((el, point) => {
    const p = new DOMPoint(point.x, point.y).matrixTransform((el as SVGSVGElement).getScreenCTM()!.inverse());
    return { x: p.x, y: p.y };
  }, { x, y });
}

async function screenPoint(page: Page, point: { x: number; y: number }) {
  return page.locator(".arch-modal-svg").evaluate((el, point) => {
    const p = new DOMPoint(point.x, point.y).matrixTransform((el as SVGSVGElement).getScreenCTM()!);
    return { x: p.x, y: p.y };
  }, point);
}

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`zooms around the pointer and fits the full diagram at ${viewport.width}px`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewport);
    await openDiagram(page);
    const pane = page.locator(".arch-diagram-viewport");
    const opening = await pane.getAttribute("data-zoom");
    const openingScale = Number(opening);
    const font = await page.locator(".arch-node-inner text").first().evaluate(el => {
      const svg = el.closest("svg")!;
      return parseFloat(getComputedStyle(el).fontSize) * svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
    });
    expect(font).toBeGreaterThanOrEqual(11);
    expect(font).toBeLessThan(15);
    const box = (await pane.boundingBox())!;
    const pointer = { x: box.x + box.width * .64, y: box.y + box.height / 2 };
    const point = await worldPoint(page, pointer.x, pointer.y);
    const pageY = await page.evaluate(() => scrollY);
    const modalY = await page.locator(".arch-modal-container").evaluate(el => el.scrollTop);
    await page.mouse.move(pointer.x, pointer.y);
    await page.mouse.wheel(0, -120);
    await expect.poll(async () => Number(await pane.getAttribute("data-zoom"))).toBeGreaterThan(openingScale + .15);
    let anchored = await screenPoint(page, point);
    expect(Math.abs(anchored.x - pointer.x)).toBeLessThan(2);
    expect(Math.abs(anchored.y - pointer.y)).toBeLessThan(2);
    await page.screenshot({ path: test.info().outputPath("pointer-zoom.png") });
    await page.mouse.wheel(0, 120);
    await expect.poll(async () => Number(await pane.getAttribute("data-zoom"))).toBeCloseTo(openingScale, 2);
    anchored = await screenPoint(page, point);
    expect(Math.abs(anchored.x - pointer.x)).toBeLessThan(2);
    expect(Math.abs(anchored.y - pointer.y)).toBeLessThan(2);
    expect(await page.evaluate(() => scrollY)).toBe(pageY);
    expect(await page.locator(".arch-modal-container").evaluate(el => el.scrollTop)).toBe(modalY);

    for (let index = 0; index < 3; index++) await page.mouse.wheel(0, -5000);
    await expect.poll(async () => Number(await pane.getAttribute("data-zoom"))).toBe(3);
    await page.getByRole("button", { name: "Fit full diagram" }).click();
    await expect.poll(async () => Number(await pane.getAttribute("data-zoom"))).toBeLessThan(3);
    const fit = await pane.evaluate(el => {
      const viewport = el.getBoundingClientRect();
      const nodes = [...el.querySelectorAll(".arch-node-group")].map(node => node.getBoundingClientRect());
      return { left: Math.min(...nodes.map(node => node.left)) - viewport.left,
        top: Math.min(...nodes.map(node => node.top)) - viewport.top,
        right: viewport.right - Math.max(...nodes.map(node => node.right)),
        bottom: viewport.bottom - Math.max(...nodes.map(node => node.bottom)) };
    });
    for (const margin of Object.values(fit)) expect(margin).toBeGreaterThanOrEqual(8);
    await page.screenshot({ path: test.info().outputPath("whole-diagram.png") });
    const fitScale = Number(await pane.getAttribute("data-zoom"));
    await page.getByRole("button", { name: "Zoom in diagram" }).click();
    await pane.focus();
    await page.keyboard.press("+");
    await expect.poll(async () => Number(await pane.getAttribute("data-zoom"))).toBeCloseTo(fitScale * 1.44, 2);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.locator("#work .deck-mini-diagram-box").first().click();
    await expect(pane).toHaveAttribute("data-zoom", opening!);
  });
}

test("pinches the phone diagram around the midpoint, then drags it", async ({ page, context }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await openDiagram(page);
  const pane = page.locator(".arch-diagram-viewport");
  const box = (await pane.boundingBox())!;
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const point = await worldPoint(page, center.x, center.y);
  const before = Number(await pane.getAttribute("data-zoom"));
  const cdp = await context.newCDPSession(page);
  const touches = (spread: number) => [-1, 1].map((sign, id) => ({ x: center.x + sign * spread, y: center.y,
    radiusX: 1, radiusY: 1, force: 1, id: id + 1 }));
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: touches(45) });
  for (const spread of [50, 60, 70, 80]) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: touches(spread) });
    await page.waitForTimeout(40);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(async () => Number(await pane.getAttribute("data-zoom"))).toBeGreaterThan(before * 1.5);
  const anchored = await screenPoint(page, point);
  expect(Math.abs(anchored.x - center.x)).toBeLessThan(3);
  expect(Math.abs(anchored.y - center.y)).toBeLessThan(3);
  const dragPoint = await worldPoint(page, center.x, center.y);
  const touch = (delta: number) => [{ x: center.x - delta, y: center.y - delta * .5, radiusX: 1, radiusY: 1, force: 1, id: 1 }];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: touch(0) });
  for (const delta of [15, 30, 45, 60, 75]) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: touch(delta) });
    await page.waitForTimeout(40);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
  await expect.poll(async () => (await screenPoint(page, dragPoint)).x).toBeLessThan(center.x - 60);
  await expect.poll(async () => (await screenPoint(page, dragPoint)).y).toBeLessThan(center.y - 25);
  await page.screenshot({ path: test.info().outputPath("pinched-and-panned.png") });
});
