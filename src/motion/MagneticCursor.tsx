import { useEffect, useRef, useState } from "react";
import { useMotionMode } from "./use-motion-mode.ts";

/**
 * Magnetic cursor: a custom cursor that follows the pointer with
 * spring physics and uses mix-blend-mode: difference for visibility.
 * Disabled in native mode and on touch devices.
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

    let raf = 0;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    const stiffness = 0.15;

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const tick = () => {
      currentX += (targetX - currentX) * stiffness;
      currentY += (targetY - currentY) * stiffness;
      el.style.transform = `translate(${currentX}px, ${currentY}px)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
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
