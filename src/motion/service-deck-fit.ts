import { useLayoutEffect, useState, type RefObject } from "react";
import { STACK_STEP_PX } from "./throw-deck.ts";

type DeckLayout = { fits: boolean; stackStep: number };

/** Share card 03's frame, growing every card together when wrapping needs more room. */
export function useServiceDeckFit(
  sectionRef: RefObject<HTMLElement | null>,
  cardRefs: RefObject<(HTMLElement | null)[]>,
  enabled: boolean,
): DeckLayout {
  const [layout, setLayout] = useState<DeckLayout>({ fits: false, stackStep: STACK_STEP_PX });

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!enabled || !section) return;
    const cards = cardRefs.current.filter((card): card is HTMLElement => card !== null);
    let frame = 0;
    const measure = () => {
      const heights = cards.map(card => {
        const style = getComputedStyle(card);
        const top = card.querySelector<HTMLElement>(".service-card-topbar")!;
        const main = card.querySelector<HTMLElement>(".service-card-main")!;
        const side = card.querySelector<HTMLElement>(".service-card-side")!;
        // Tablets use one column; desktop uses two. Both retain their natural type size.
        const columns = getComputedStyle(card).gridTemplateColumns.trim().split(/\s+/).length;
        const body = columns === 1
          ? main.offsetHeight + side.offsetHeight + parseFloat(getComputedStyle(side).marginTop)
          : Math.max(main.offsetHeight, side.offsetHeight);
        return Math.ceil(top.offsetHeight + parseFloat(getComputedStyle(top).marginBottom)
          + body + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
          + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth)) + 2;
      });
      const referenceHeight = heights[2] ?? 0;
      const height = Math.max(referenceHeight, ...heights);
      const inset = parseFloat(getComputedStyle(section).getPropertyValue("--service-stage-top"));
      const available = window.innerHeight - inset - 16;
      // Tight laptop windows use a shallower overlap before falling back to
      // page scrolling. Text size and the common card frame stay intact.
      const stackStep = Math.min(STACK_STEP_PX, Math.max(0, Math.floor((available - height) / Math.max(1, cards.length - 1))));
      const fits = height <= available;
      cards.forEach(card => {
        if (card.style.getPropertyValue("--service-card-height") !== `${height}px`) {
          card.style.setProperty("--service-card-height", `${height}px`);
        }
      });
      setLayout(previous => previous.fits === fits && previous.stackStep === stackStep
        ? previous : { fits, stackStep });
    };
    const queueMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(queueMeasure);
    for (const element of cards.flatMap(card => Array.from(card.children))) observer.observe(element);
    window.addEventListener("resize", queueMeasure);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", queueMeasure);
    };
  }, [enabled, sectionRef, cardRefs]);

  return layout;
}
