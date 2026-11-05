import { useEffect, type RefObject } from "react";
import { useMotionMode } from "./use-motion-mode.ts";

/** Only the decorative light follows the pointer; the card's text stays flat. */
export function useCardSpotlight(
  cardRef: RefObject<HTMLElement | null>,
  spotlightRef: RefObject<HTMLElement | null>,
  enabled = true,
): void {
  const enhanced = useMotionMode() === "enhanced";
  useEffect(() => {
    const card = cardRef.current;
    const spotlight = spotlightRef.current;
    if (!card || !spotlight || !enabled || !enhanced) return;
    let frame = 0;
    let x = 0;
    let y = 0;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x = event.clientX;
      y = event.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = card.getBoundingClientRect();
        spotlight.style.transform = `translate(${Math.round(x - rect.left)}px, ${Math.round(y - rect.top)}px)`;
      });
    };
    card.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      card.removeEventListener("pointermove", move);
    };
  }, [cardRef, spotlightRef, enabled, enhanced]);
}
