import { render } from "@testing-library/react";
import { act, useRef } from "react";
import { expect, it } from "vitest";
import { useGridScrollReveal } from "../motion/grid-scroll-reveal.ts";

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

function Grid() {
  const grid = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLElement | null)[]>([]);
  useGridScrollReveal(grid, items, (inv) => `translateY(${inv * 80}px)`, true);
  return <div ref={grid}><article ref={(el) => { items.current[0] = el; }}>Readable text</article></div>;
}

it("leaves settled cards untouched on unrelated scroll frames, then reveals again on reversal", async () => {
  const view = render(<Grid />);
  const card = view.getByRole("article");
  let top = 0;
  Object.defineProperty(card, "offsetTop", { get: () => top });
  await act(nextFrame);
  expect(card).toHaveClass("is-open");
  let mutations = 0;
  const observer = new MutationObserver((entries) => { mutations += entries.length; });
  observer.observe(card, { attributes: true });
  for (let i = 0; i < 3; i++) await act(async () => { window.dispatchEvent(new Event("scroll")); await nextFrame(); });
  expect(mutations).toBe(0);
  top = innerHeight;
  await act(async () => { window.dispatchEvent(new Event("scroll")); await nextFrame(); });
  expect(card).not.toHaveClass("is-open");
  expect(card.style.transform).not.toBe("");
  expect(mutations).toBeGreaterThan(0);
  observer.disconnect();
});
