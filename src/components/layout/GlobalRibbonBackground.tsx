import { useEffect, useRef, useState, type JSX } from "react";
import { onFrame } from "../../motion/frame.ts";
import { useMotionMode } from "../../motion/use-motion-mode.ts";

export function GlobalRibbonBackground(): JSX.Element {
  const enhanced = useMotionMode() === "enhanced";
  const wrapperRef = useRef<HTMLDivElement>(null);
  const path1Ref = useRef<HTMLDivElement>(null);
  const path2Ref = useRef<HTMLDivElement>(null);
  const [viewBox, setViewBox] = useState("0 0 1440 900");

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const path1 = path1Ref.current;
    const path2 = path2Ref.current;
    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setViewBox(`0 0 ${Math.round(width)} ${Math.round(height)}`);
    });
    resizeObserver.observe(wrapper);

    let stop: (() => void) | undefined;
    let lastY = window.scrollY;
    let target = 0;
    let shift = 0;
    const handleScroll = () => {
      const y = window.scrollY;
      target = Math.max(-28, Math.min(28, (y - lastY) * 0.15));
      lastY = y;
      if (stop) return;
      // Move cached decorative layers instead of repainting SVG paths. Keep
      // their layer allocation stable when scrolling stops; no text is here.
      stop = onFrame("write", (_time, delta) => {
        const ease = 1 - Math.exp(-10 * delta);
        shift += (target - shift) * ease;
        target *= Math.exp(-7 * delta);
        const settled = Math.abs(shift) < 0.02 && Math.abs(target) < 0.02;
        if (path1) path1.style.transform = settled ? "translate3d(0, 0, 0)" : `translate3d(${shift.toFixed(2)}px, ${(-shift * 0.6).toFixed(2)}px, 0)`;
        if (path2) path2.style.transform = settled ? "translate3d(0, 0, 0)" : `translate3d(${(-shift * 0.8).toFixed(2)}px, ${(shift * 0.5).toFixed(2)}px, 0)`;
        if (settled) {
          stop?.();
          stop = undefined;
        }
      });
    };
    if (enhanced) window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      stop?.();
      window.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
      path1?.style.removeProperty("transform");
      path2?.style.removeProperty("transform");
    };
  }, [enhanced]);

  return (
    <div ref={wrapperRef} className={`global-ribbon-wrapper${enhanced ? " ribbon-animated" : ""}`} aria-hidden="true">
      <div ref={path1Ref} className="global-ribbon-layer">
      <svg className="global-ribbon-svg" viewBox={viewBox} preserveAspectRatio="none">
        <defs>
          <linearGradient id="globalRibbonGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.02" />
            <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.14" />
            <stop offset="70%" stopColor="#818cf8" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <g fill="none" stroke="url(#globalRibbonGrad1)" strokeLinecap="round">
          <path d="M -100,200 C 500,100 900,700 1540,400" strokeWidth="58" opacity="0.25" />
          <path d="M -100,200 C 500,100 900,700 1540,400" strokeWidth="42" />
        </g>
      </svg>
      </div>
      <div ref={path2Ref} className="global-ribbon-layer">
      <svg className="global-ribbon-svg" viewBox={viewBox} preserveAspectRatio="none">
        <defs>
          <linearGradient id="globalRibbonGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.02" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="url(#globalRibbonGrad2)" strokeLinecap="round">
          <path d="M -80,600 C 400,800 1000,200 1520,600" strokeWidth="44" opacity="0.25" />
          <path d="M -80,600 C 400,800 1000,200 1520,600" strokeWidth="28" />
        </g>
      </svg>
      </div>
    </div>
  );
}
