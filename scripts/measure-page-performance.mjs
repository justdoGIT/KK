import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";

// Run against a production preview. An optional executable supports hosts
// whose installed Chromium differs from Playwright's downloaded browser.
const [url = "http://127.0.0.1:4173", output = "/tmp/portfolio-performance.json", executablePath] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath, args: ["--enable-unsafe-swiftshader"] });
const results = [];
try {
  for (const [name, options] of [
    ["desktop", { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 }],
    ["phone", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }],
  ]) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    await page.addInitScript(() => {
      const stats = window.portfolioPerformance = { longTasks: [], lcp: 0, cls: 0, draws: new WeakMap() };
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) stats.longTasks.push(entry.duration);
      }).observe({ type: "longtask", buffered: true });
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) stats.lcp = entry.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) stats.cls += entry.value;
      }).observe({ type: "layout-shift", buffered: true });
      for (const prototype of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
        const clear = prototype.clear;
        prototype.clear = function (mask) {
          stats.draws.set(this.canvas, (stats.draws.get(this.canvas) ?? 0) + 1);
          return clear.call(this, mask);
        };
      }
    });
    await page.goto(url, { waitUntil: "load" });
    await page.waitForTimeout(15000);
    await page.keyboard.press("Escape");
    const startup = await page.evaluate(() => {
      const stats = window.portfolioPerformance;
      const navigation = performance.getEntriesByType("navigation")[0];
      const resources = performance.getEntriesByType("resource");
      const canvas = document.querySelector(".scene-container canvas");
      const gl = canvas?.getContext("webgl2");
      const debug = gl?.getExtension("WEBGL_debug_renderer_info");
      return {
        observedMs: Math.round(performance.now()),
        domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
        largestContentfulPaintMs: Math.round(stats.lcp),
        layoutShiftSum: Number(stats.cls.toFixed(4)),
        longTaskCount: stats.longTasks.length,
        longestTaskMs: Math.round(Math.max(0, ...stats.longTasks)),
        blockingExcessMs: Math.round(stats.longTasks.reduce((sum, duration) => sum + Math.max(0, duration - 50), 0)),
        resourceCount: resources.length,
        resourceBodyBytes: resources.reduce((sum, entry) => sum + entry.encodedBodySize, 0),
        renderer: gl && debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : "unavailable",
        bufferSize: canvas ? [canvas.width, canvas.height] : null,
      };
    });
    await page.locator(".client-metrics-strip").evaluate(element => element.scrollIntoView({ block: "start", behavior: "instant" }));
    await page.waitForTimeout(1000);
    const readDraws = () => page.evaluate(() => {
      const canvas = document.querySelector(".scene-container canvas");
      return canvas ? window.portfolioPerformance.draws.get(canvas) ?? 0 : 0;
    });
    const before = await readDraws();
    await page.waitForTimeout(2000);
    const after = await readDraws();
    results.push({ profile: name, ...startup, heroDrawsWhileReadingMetrics: after - before });
    console.log(JSON.stringify(results.at(-1)));
    await context.close();
  }
} finally {
  await browser.close();
}
await writeFile(output, JSON.stringify({ url, browser: "Chromium", results }, null, 2) + "\n");
console.log(`Saved ${output}`);
