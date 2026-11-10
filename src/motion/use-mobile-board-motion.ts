import { useEffect, type RefObject } from "react";
import { onFrame } from "./frame.ts";
import { writeStyle } from "./dom-style.ts";

export type MobileBoardMotion = "slide" | "stack" | "flip" | "push";

const ease = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };

/** Native swipe distance drives the card pose; settled cards return to flat text. */
export function useMobileBoardMotion(viewportRef: RefObject<HTMLDivElement | null>, motion: MobileBoardMotion, enabled: boolean): void {
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || motion === "slide" || !enabled) return;
    const slides = [...viewport.children] as HTMLElement[];
    const faces = slides.map(slide => slide.querySelector<HTMLElement>(".mobile-board-motion")!);
    // Each card gets a stable pose for this visit, so swipes feel shuffled
    // without random jitter or a different trajectory when reversing.
    const poses = slides.map(() => ({ angle: (Math.random() - .5) * 12, lift: (Math.random() - .5) * 20 }));
    const section = viewport.closest("section");
    let dirty = true;
    let measure = true;
    let stride = 1;
    let position = 0;
    let entrance = 1;
    let offsets: number[] = [];
    const invalidate = () => { dirty = true; };
    const resize = new ResizeObserver(() => { measure = true; dirty = true; });
    resize.observe(viewport);
    viewport.addEventListener("scroll", invalidate, { passive: true });
    if (motion === "flip") window.addEventListener("scroll", invalidate, { passive: true });
    const stopRead = onFrame("read", () => {
      if (!dirty) return;
      if (measure) {
        offsets = slides.map(slide => slide.offsetLeft);
        stride = Math.max(1, (offsets[1] ?? viewport.clientWidth) - offsets[0]);
        measure = false;
      }
      position = viewport.scrollLeft;
      if (motion === "flip" && section) {
        entrance = ease((innerHeight * .72 - section.getBoundingClientRect().top) / (innerHeight * .72 - 60));
      }
    });
    const stopWrite = onFrame("write", () => {
      if (!dirty) return;
      dirty = false;
      const current = (position - offsets[0]) / stride;
      const nearest = Math.round(current);
      const moving = Math.abs(current - nearest) > .005;
      const entering = motion === "flip" && nearest === 0 && entrance < .999;
      viewport.dataset.cardMotion = moving ? motion : entering ? "entrance" : "settled";
      faces.forEach((face, index) => {
        if (!face) return;
        const distance = current - index;
        if (motion === "stack") {
          const amount = Math.min(1, Math.abs(distance));
          writeStyle(face, "transform", amount < .005 ? "none"
            : `perspective(900px) rotateY(${(-distance * 16).toFixed(2)}deg) rotateZ(${(-distance * 3).toFixed(2)}deg) scale(${(1 - amount * .045).toFixed(4)})`);
          return;
        }
        if (motion === "push") {
          const lower = Math.floor(current);
          const fraction = current - lower;
          const incoming = index === lower + 1;
          const shown = moving ? index === lower || incoming : index === nearest;
          const amount = Math.sin(fraction * Math.PI);
          const worldX = incoming ? stride * (1 - ease(fraction)) : -stride * ease((fraction - .14) / .86);
          const correction = position - offsets[index] + worldX;
          writeStyle(face, "opacity", shown ? "1" : "0");
          writeStyle(face, "pointer-events", shown && !moving ? "auto" : "none");
          writeStyle(slides[index], "z-index", incoming ? "3" : "2");
          writeStyle(face, "transform", !moving && index === nearest ? "none"
            : `translateX(${correction.toFixed(2)}px) translateY(${(poses[index].lift * amount).toFixed(2)}px) rotate(${(poses[index].angle * amount).toFixed(2)}deg) scale(${(1 - amount * .025).toFixed(4)})`);
          face.dataset.active = String(shown && !moving);
          const front = face.querySelector<HTMLElement>(".mobile-board-front");
          if (front) front.inert = !shown || moving;
          return;
        }
        const shown = index === nearest;
        writeStyle(face, "opacity", shown ? "1" : "0");
        writeStyle(slides[index], "z-index", shown ? "2" : "1");
        const turn = distance >= 0 ? Math.min(1, distance * 2) * 180
          : 360 - Math.min(1, -distance * 2) * 180;
        const rest = Math.abs(distance) < .005 && !(index === 0 && entering);
        const angle = index === 0 && !moving ? -180 * (1 - entrance) : turn;
        writeStyle(face, "transform", rest ? "none"
          : `translateX(${(position - offsets[index]).toFixed(2)}px) rotateY(${angle.toFixed(2)}deg)`);
        writeStyle(face, "pointer-events", shown && rest ? "auto" : "none");
        const front = face.querySelector<HTMLElement>(".mobile-board-front");
        if (front) front.inert = !shown || !rest;
      });
    });
    return () => {
      stopRead(); stopWrite(); resize.disconnect();
      viewport.removeEventListener("scroll", invalidate);
      window.removeEventListener("scroll", invalidate);
      delete viewport.dataset.cardMotion;
      slides.forEach((slide, index) => {
        slide.style.removeProperty("z-index");
        const face = faces[index];
        if (!face) return;
        face.style.removeProperty("transform");
        face.style.removeProperty("opacity");
        face.style.removeProperty("pointer-events");
        delete face.dataset.active;
        const front = face.querySelector<HTMLElement>(".mobile-board-front");
        if (front) front.inert = false;
      });
    };
  }, [viewportRef, motion, enabled]);
}
