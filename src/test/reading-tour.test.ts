import { describe, expect, it } from "vitest";
import { readingSeconds, readingWindows } from "../motion/reading-pace.ts";
import { TourEngine, type TourStep } from "../motion/tour-engine.ts";
import { resumeStepIndex } from "../motion/tour-resume.ts";

function harness(steps: TourStep[], reduced = false, initialY = 0, resume = false) {
  let y = initialY;
  let completed = 0;
  const visited: string[] = [];
  const engine = new TourEngine(steps, {
    y: () => y, scroll: (next) => { y = next; }, viewport: () => 800,
    limit: () => 10000, reduced, changed: (step) => visited.push(step.id), complete: () => { completed++; },
  }, 0, resume);
  const run = (seconds: number) => { for (let t = 0; t < seconds; t += 0.05) engine.tick(0.05); };
  return { engine, run, visited, y: () => y, completed: () => completed };
}

const step = (id: string, y = 0): TourStep => ({ id, chapter: id, label: id, target: () => y, text: () => "Read this." });

describe("comprehension pace", () => {
  it("gives technical copy its entire reading time without a long-card cap", () => {
    expect(readingSeconds("word ".repeat(150))).toBe(64);
    expect(readingSeconds("word ".repeat(600))).toBe(244);
    expect(readingSeconds("")).toBe(8);
  });
  it("holds overlapping windows still and gives the final lines a full dwell", () => {
    const windows = readingWindows(60, 1400, 1000);
    expect(windows.position(19)).toBe(0);
    expect(windows.position(20.7)).toBeCloseTo(0.25);
    expect(windows.position(22)).toBe(0.5);
    expect(windows.position(windows.duration - 19)).toBe(1);
    expect(windows.position(windows.duration)).toBe(1);
  });
});

describe("coordinated reading tour", () => {
  it("resumes a pinned chapter without rewinding the page or its nested text", () => {
    const inner = { scrollTop: 600, scrollHeight: 1600, clientHeight: 400 } as HTMLElement;
    let target = 1200;
    const h = harness([
      { ...step("card", 1200), target: () => target, inner: () => inner, text: () => "word ".repeat(150) },
      { ...step("next", 2000), inner: () => inner },
    ], false, 1500, true);
    h.run(0.1);
    expect(h.y()).toBe(1500);
    target = 1100; // Layout can change again while settling.
    h.run(1.2);
    expect(inner.scrollTop).toBe(600);
    h.run(50);
    expect(h.y()).toBe(1500);
    expect(inner.scrollTop).toBeGreaterThan(600);
    for (let i = 0; i < 600 && h.engine.step?.id === "card"; i++) h.engine.tick(0.05);
    expect(h.visited).toEqual(["card", "next"]);
    for (let i = 0; i < 100 && h.engine.phase !== "read"; i++) h.engine.tick(0.05);
    expect(h.y()).toBe(2000);
    expect(inner.scrollTop).toBe(0);
  });
  it("waits for scene readiness before spending reading time", () => {
    let ready = false;
    const h = harness([{ ...step("scene"), ready: () => ready }]);
    h.run(300);
    expect(h.engine.phase).toBe("settle");
    expect(h.completed()).toBe(0);
    ready = true;
    h.run(7);
    expect(h.completed()).toBe(0);
    h.run(3);
    expect(h.completed()).toBe(1);
  });
  it("shows every slide and its last lines before advancing to the next chapter", () => {
    const inner = { scrollTop: 0, scrollHeight: 1600, clientHeight: 400 } as HTMLElement;
    let lastLines = -1;
    const h = harness([
      { ...step("slide-1", 1200), inner: () => inner, text: () => "word ".repeat(150) },
      { ...step("slide-2", 1200), enter: () => { lastLines = inner.scrollTop; } },
      step("footer", 3000),
    ]);
    h.run(60);
    expect(h.visited).toEqual(["slide-1"]);
    h.run(60);
    expect(lastLines).toBe(1200);
    expect(h.visited).toEqual(["slide-1", "slide-2", "footer"]);
    expect(h.y()).toBe(3000);
    expect(h.completed()).toBe(1);
    h.run(500);
    expect(h.completed()).toBe(1);
  });
  it("can stop ticking for a paused/hidden tab without expiring reading time", () => {
    const h = harness([{ ...step("intro"), text: () => "word ".repeat(150) }, step("next", 1000)]);
    h.run(30);
    h.engine.tick(0);
    expect(h.visited).toEqual(["intro"]);
    h.run(30);
    expect(h.visited).toEqual(["intro"]);
    h.run(10);
    expect(h.visited).toEqual(["intro", "next"]);
  });
  it("plays the complete scroll-driven action and then holds its final frame", () => {
    const h = harness([{ ...step("robot", 1000), end: () => 2000, continuous: true, seconds: 30 }]);
    h.run(8);
    expect(h.y()).toBeCloseTo(1000, -2);
    h.run(30);
    expect(h.y()).toBeGreaterThan(1850);
    expect(h.completed()).toBe(0);
    h.run(10);
    expect(h.y()).toBe(2000);
    expect(h.completed()).toBe(1);
  });
  it("uses stationary page turns when reduced motion is explicitly started", () => {
    const h = harness([{ ...step("document", 1000), end: () => 2400, seconds: 60 }], true);
    h.run(1.2);
    expect(h.y()).toBe(1000);
    h.run(14);
    expect(h.y()).toBe(1000);
    h.run(6);
    expect(h.y()).toBeCloseTo(1000 + 1400 / 3);
  });
});

describe("resume selection after manual navigation", () => {
  const steps = [step("work-heading", 1000), step("work-0", 2400), step("work-1", 2400), step("footer", 4000)]
    .map((s) => ({ ...s, chapter: s.id.startsWith("work") ? "work" : "footer" }));
  it("fans out an unfinished deck before reading its cards", () => {
    expect(resumeStepIndex(steps, 1800, "work")).toBe(1);
  });
  it("reads the current pinned cards instead of their hidden heading", () => {
    expect(resumeStepIndex(steps, 2600, "work")).toBe(1);
    expect(resumeStepIndex(steps, 2600, "work", "work-1")).toBe(2);
  });
  it("selects the current portion of a continuous animation after scrolling", () => {
    const timeline = [
      { ...step("career-0", 1000), chapter: "career", end: () => 2000 },
      { ...step("career-1", 2100), chapter: "career", end: () => 3000 },
    ];
    expect(resumeStepIndex(timeline, 2500, "career", "career-0")).toBe(1);
    expect(resumeStepIndex(timeline, 1600, "career")).toBe(0);
  });
});
