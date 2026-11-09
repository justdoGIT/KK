import type { TourStep } from "./tour-engine.ts";

export const one = (selector: string) => document.querySelector<HTMLElement>(selector);
export const all = (selector: string) => [...document.querySelectorAll<HTMLElement>(selector)];
export const copy = (selector: string) => one(selector)?.innerText ?? "";

/** Layout coordinates ignore the temporary transform on a revealing card. */
export function layoutTop(element: HTMLElement | null): number {
  let top = 0;
  for (let el = element; el; el = el.offsetParent as HTMLElement | null) top += el.offsetTop;
  return top;
}

export function pinnedY(selector: string, progress: number): number {
  const el = one(selector);
  return layoutTop(el) + Math.max(0, (el?.offsetHeight ?? 0) - innerHeight) * progress;
}

export function flowStep(id: string, chapter: string, selector: string, index = 0): TourStep {
  const element = () => all(selector)[index] ?? null;
  return {
    id, chapter,
    label: element()?.querySelector("h2, h3")?.textContent ?? element()?.getAttribute("aria-label") ?? "Read on",
    target: () => Math.max(0, layoutTop(element()) - 72),
    end: () => Math.max(layoutTop(element()) - 72, layoutTop(element()) + (element()?.offsetHeight ?? 0) - innerHeight + 24),
    text: () => element()?.innerText ?? "",
  };
}

export function carouselSteps(chapter: string, prefix: string): TourStep[] | null {
  const selector = `${chapter} .mobile-board-slide`;
  const slides = all(selector);
  if (!slides.length) return null;
  return slides.map((_, index) => {
    const slide = () => all(selector)[index];
    const viewport = () => one(`${chapter} .mobile-board-viewport`);
    return {
      id: `${prefix}-${index}`, chapter,
      label: slides[index].querySelector("h3")?.textContent ?? `Board ${index + 1}`,
      target: () => layoutTop(one(chapter)) - 56,
      text: () => slide()?.innerText ?? "",
      inner: () => slide() ?? null,
      enter: () => {
        viewport()?.scrollTo({ left: slide()?.offsetLeft ?? 0,
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      },
      ready: () => Math.abs((viewport()?.scrollLeft ?? 0) - (slide()?.offsetLeft ?? 0)) < 2,
    };
  });
}

export function flowCards(chapter: string, prefix: string, selector: string): TourStep[] {
  return all(selector).map((_, i) => flowStep(`${prefix}-${i}`, chapter, selector, i));
}
