import { useEffect, type RefObject } from "react";
import { onFrame } from "./frame.ts";
import { getLenis, haltScroll, scrollToY } from "./smooth-scroll.ts";

const START_AT = 0.02;
const VIEWPORT_TOP = 0.08;
const VIEWPORT_BOTTOM = 0.92;

/** Mutable guard that prevents guided scrolling from hijacking normal travel. */
export class GuidedScrollSession {
  private armed = false;
  private cruising = false;
  private completed = false;

  /** Returns true when an active cruise must be stopped. */
  intent(direction: number, sectionVisible: boolean): boolean {
    if (direction < 0) return this.cancel();
    if (direction > 0 && sectionVisible && !this.completed) this.armed = true;
    return false;
  }

  tryStart(progress: number, startAt: number, target: number): boolean {
    if (!this.armed || this.cruising || this.completed || progress < startAt || progress >= target) return false;
    this.armed = false;
    this.cruising = true;
    this.completed = true;
    return true;
  }

  cancel(): boolean {
    this.armed = false;
    if (!this.cruising) return false;
    this.cruising = false;
    this.completed = true;
    return true;
  }

  finish(): void {
    this.cruising = false;
  }

  resetBeforeSection(scrolled: number, viewportHeight: number): void {
    if (!this.cruising && scrolled < -viewportHeight * 0.25) this.completed = false;
  }
}

/**
 * After explicit downward wheel/touch intent inside a pinned section, cruises
 * its scroll-linked story at a constant authored speed. Reverse input, keys,
 * or pointer interaction stop it immediately; each section runs once per pass.
 */
export function useGuidedScroll(
  section: RefObject<HTMLElement | null>,
  enabled: boolean,
  target: number,
  speedPixelsPerSecond: number,
): void {
  useEffect(() => {
    if (!enabled) return;
    const session = new GuidedScrollSession();
    let touchY: number | null = null;

    const sectionVisible = (): boolean => {
      const element = section.current;
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return rect.top <= window.innerHeight * VIEWPORT_BOTTOM && rect.bottom >= window.innerHeight * VIEWPORT_TOP;
    };
    const cancel = () => {
      if (session.cancel()) haltScroll();
    };
    const onWheel = (event: WheelEvent) => {
      if (session.intent(Math.sign(event.deltaY), sectionVisible())) haltScroll();
    };
    const onTouchStart = (event: TouchEvent) => {
      cancel();
      touchY = event.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY ?? null;
      if (y !== null && touchY !== null && session.intent(Math.sign(touchY - y), sectionVisible())) {
        haltScroll();
      }
      touchY = y;
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", cancel);
    window.addEventListener("pointerdown", cancel);

    const stopFrame = onFrame("read", () => {
      const element = section.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const scrollable = element.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const top = rect.top + (getLenis()?.scroll ?? window.scrollY);
      const scrolled = -rect.top;
      session.resetBeforeSection(scrolled, window.innerHeight);
      const progress = Math.max(0, Math.min(1, scrolled / scrollable));
      if (!session.tryStart(progress, START_AT, target)) return;
      const destination = top + target * scrollable;
      const duration = (destination - (getLenis()?.scroll ?? window.scrollY)) / speedPixelsPerSecond;
      scrollToY(destination, {
        duration: Math.max(0.1, duration),
        easing: (x) => x,
        onComplete: () => session.finish(),
      });
    });

    return () => {
      stopFrame();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", cancel);
      window.removeEventListener("pointerdown", cancel);
      cancel();
    };
  }, [enabled, section, speedPixelsPerSecond, target]);
}
