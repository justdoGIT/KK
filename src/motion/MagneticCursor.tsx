import { useEffect, useRef, useState } from "react";
import { onFrame } from "./frame.ts";
import { useMotionMode } from "./use-motion-mode.ts";

// Below this gap (px) the spring is considered settled; the frame
// subscription stops until the next pointermove instead of ticking forever.
const SETTLE_EPSILON = 0.05;

/**
 * Magnetic cursor: a custom cursor that follows the pointer with spring
 * physics. Disabled in native mode and on touch devices.
 */
export function MagneticCursor() {
  const mode = useMotionMode();
  const ref = useRef<HTMLDivElement>(null);
  const [touch] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(hover: none)").matches;
  });

  useEffect(() => {
    if (mode !== "enhanced" || touch) return;
    const el = ref.current;
    if (!el) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    const stiffness = 0.15;

    let stopTick: (() => void) | null = null;
    const startTick = () => {
      if (stopTick) return;
      stopTick = onFrame("write", () => {
        currentX += (targetX - currentX) * stiffness;
        currentY += (targetY - currentY) * stiffness;
        el.style.transform = `translate(${currentX}px, ${currentY}px)`;
        const settled = Math.abs(targetX - currentX) < SETTLE_EPSILON && Math.abs(targetY - currentY) < SETTLE_EPSILON;
        if (settled) {
          stopTick?.();
          stopTick = null;
        }
      });
    };

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      startTick();
    };

    window.addEventListener("pointermove", onMove);

    return () => {
      window.removeEventListener("pointermove", onMove);
      stopTick?.();
    };
  }, [mode, touch]);

  if (mode !== "enhanced" || touch) return null;

  return (
    <div
      ref={ref}
      className="magnetic-cursor"
      aria-hidden="true"
      style={{ willChange: "transform" }}
    >
      <div className="magnetic-cursor-dot" />
    </div>
  );
}
