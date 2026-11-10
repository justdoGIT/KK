import { useEffect } from "react";
import { onFrame } from "./frame.ts";
import { TourEngine } from "./tour-engine.ts";
import { resumeStepIndex } from "./tour-resume.ts";
import { buildTourPlan } from "./tour-plan.ts";
import { one } from "./tour-dom.ts";
import { getLenis, scrollToY, stopCruise } from "./smooth-scroll.ts";
import { getReadingTour, ownReadingTour, subscribeReadingTour, updateReadingTour } from "./reading-tour-state.ts";
import { useMotionMode } from "./use-motion-mode.ts";

/** Installs one automatic reading tour. Intentional input always hands control
 * back to the visitor; hover alone must not strand a stationary reader. */
export function useReadingTourDriver() {
  const enhanced = useMotionMode() === "enhanced";
  useEffect(() => {
    const release = ownReadingTour();
    let engine: TourEngine | undefined;
    let stop: (() => void) | undefined;
    let lastStatus = getReadingTour().status;
    let expected = scrollY;
    let cancelled = false;
    let resizing = false;
    let resizeTimer = 0;
    let startTimer = 0;
    let blocked = false;
    let lastFrameTime: number | undefined;
    let checkpoint: { y: number; inner: HTMLElement | null; top: number; viewport: HTMLElement | null; left: number } | undefined;

    const pause = () => {
      if (getReadingTour().status === "playing") updateReadingTour({ status: "paused" });
    };
    const freeze = () => {
      if (stop) {
        const inner = engine?.step?.inner?.() ?? null;
        const viewport = engine?.step ? one(`${engine.step.chapter} .mobile-board-viewport`) : null;
        checkpoint = { y: scrollY, inner, top: inner?.scrollTop ?? 0, viewport, left: viewport?.scrollLeft ?? 0 };
      }
      stop?.(); stop = undefined;
      stopCruise();
      if (engine || getLenis()) scrollToY(scrollY, { immediate: true });
      const viewport = engine?.step && one(`${engine.step.chapter} .mobile-board-viewport`);
      viewport?.scrollTo({ left: viewport.scrollLeft, behavior: "instant" });
    };
    const play = (replay = false, resized = false) => {
      freeze();
      if (replay) scrollToY(0, { immediate: true });
      const steps = buildTourPlan(enhanced);
      const previous = engine;
      const chapter = steps.find((step) => {
        const rect = one(step.chapter)?.getBoundingClientRect();
        return rect && rect.top <= innerHeight * 0.5 && rect.bottom > innerHeight * 0.5;
      })?.chapter;
      let index = replay ? 0 : resumeStepIndex(steps, scrollY, chapter, previous?.step?.id);
      if (resized && previous) {
        const same = steps.findIndex((step) => step.id === previous.step?.id);
        if (same >= 0) index = same;
      }
      expected = scrollY;
      lastFrameTime = undefined;
      const unchanged = checkpoint && Math.abs(scrollY - checkpoint.y) < 3
        && Math.abs((checkpoint.inner?.scrollTop ?? 0) - checkpoint.top) < 2
        && Math.abs((checkpoint.viewport?.scrollLeft ?? 0) - checkpoint.left) < 2;
      if (!previous || replay || resized || !unchanged) engine = new TourEngine(steps, {
        y: () => scrollY, viewport: () => innerHeight,
        limit: () => document.documentElement.scrollHeight - innerHeight,
        reduced: !enhanced,
        scroll: (y) => {
          if (Math.abs(y - scrollY) > 0.25) scrollToY(y, { immediate: true });
          expected = scrollY;
        },
        changed: (step) => updateReadingTour({ step: step.id, label: step.label }),
        complete: () => updateReadingTour({ status: "complete" }),
      }, index, !replay && scrollY > 120);
      stop = onFrame("scroll", (time, delta) => {
        // Physics uses a capped frame delta; reading time follows the visible
        // tab's real clock so a busy renderer cannot stretch a pause indefinitely.
        const elapsed = lastFrameTime === undefined ? delta : Math.max(0, (time - lastFrameTime) / 1000);
        lastFrameTime = time;
        if (document.hidden || resizing || blocked) return;
        // Includes scrollbar dragging, find-in-page and anchor navigation.
        if (Math.abs(scrollY - expected) > 3) { pause(); return; }
        engine?.tick(elapsed);
      });
    };
    const unsubscribe = subscribeReadingTour(() => {
      const status = getReadingTour().status;
      if (status === lastStatus) return;
      const replay = lastStatus === "complete";
      lastStatus = status;
      if (status === "playing") play(replay);
      else freeze();
    });

    const input = (event: Event) => {
      if (!event.isTrusted) return;
      if (event.target instanceof Element && event.target.closest("[data-tour-control]")) {
        const activatesButton = event instanceof KeyboardEvent && ["Enter", " "].includes(event.key);
        if (event.type === "pointerdown" || event.type === "touchstart" || event.type === "focusin" || activatesButton) return;
      }
      if (event instanceof KeyboardEvent && ["Shift", "Control", "Alt", "Meta"].includes(event.key)) return;
      if (getReadingTour().status === "ready" && enhanced) updateReadingTour({ status: "paused" });
      else pause();
    };
    const selection = () => { if (!window.getSelection()?.isCollapsed) pause(); };
    const visibility = () => { lastFrameTime = undefined; };
    const resize = () => {
      resizing = true;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resizing = false;
        if (getReadingTour().status === "playing") play(false, true);
      }, 350);
    };
    // Modal and menu state can change without a pointer (e.g. keyboard or
    // application navigation). Do not move content underneath either one.
    const overlays = new MutationObserver(() => {
      blocked = !!document.querySelector('[aria-modal="true"], .nav-list-open');
      if (blocked) pause();
    });
    overlays.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["aria-modal", "aria-expanded"] });
    const events = ["wheel", "touchstart", "pointerdown", "keydown", "focusin"];
    events.forEach((type) => window.addEventListener(type, input, { capture: true, passive: true }));
    document.addEventListener("selectionchange", selection);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("resize", resize);
    stopCruise();
    if (!enhanced) updateReadingTour({ status: "ready" });
    else if (lastStatus === "playing") play();
    else if (lastStatus === "ready") {
      void (document.fonts?.ready ?? Promise.resolve()).then(() => {
        if (cancelled) return;
        startTimer = window.setTimeout(() => {
          if (getReadingTour().status !== "ready") return;
          // A restored position or a deep link is deliberate navigation.
          updateReadingTour({ status: scrollY > 120 || (location.hash && location.hash !== "#main") ? "paused" : "playing" });
        }, 1200);
      });
    }
    return () => {
      cancelled = true;
      window.clearTimeout(resizeTimer);
      window.clearTimeout(startTimer);
      unsubscribe(); freeze(); release(); overlays.disconnect();
      events.forEach((type) => window.removeEventListener(type, input, true));
      document.removeEventListener("selectionchange", selection);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("resize", resize);
    };
  }, [enhanced]);
}
