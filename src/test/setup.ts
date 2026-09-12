import "@testing-library/jest-dom/vitest";

// jsdom does not implement matchMedia; mock it for motion-mode and cursor tests
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

// jsdom does not implement IntersectionObserver
if (typeof globalThis.IntersectionObserver === "undefined") {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  globalThis.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
}

// jsdom does not implement canvas getContext; return null so WebGL check fails gracefully
if (
  typeof HTMLCanvasElement !== "undefined" &&
  !HTMLCanvasElement.prototype.getContext
) {
  HTMLCanvasElement.prototype.getContext = () => null;
}
