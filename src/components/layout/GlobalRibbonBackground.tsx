import { useEffect, useRef, useState, type JSX } from "react";
import { onFrame } from "../../motion/frame.ts";

export function GlobalRibbonBackground(): JSX.Element {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);
  const [viewBox, setViewBox] = useState("0 0 1440 900");

  useEffect(() => {
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReduced) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // The ribbon is a fixed, full-viewport background: static path geometry
    // (set once below, sized to the current viewport) animated only by a
    // compositor transform on each <path> — no per-frame `d` rewrite under
    // the active blur filter, which used to force a CPU re-rasterize of the
    // blur every frame.
    let paused = !wrapper.isConnected;
    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setViewBox(`0 0 ${Math.round(width)} ${Math.round(height)}`);
    });
    resizeObserver.observe(wrapper);

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        paused = !entry.isIntersecting;
      },
      { threshold: 0 },
    );
    visibilityObserver.observe(wrapper);

    let lastScrollY = window.scrollY;
    let targetScrollVel = 0;
    let scrollVel = 0;
    const handleScroll = () => {
      const currentY = window.scrollY;
      targetScrollVel = (currentY - lastScrollY) * 0.15;
      lastScrollY = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    const startTime = performance.now();
    const stopRead = onFrame("read", () => {
      if (paused) return;
      scrollVel += (targetScrollVel - scrollVel) * 0.1;
      targetScrollVel *= 0.92;
    });
    const stopWrite = onFrame("write", (time) => {
      if (paused) return;
      const elapsed = (time - startTime) * 0.001;
      // Gentle drift + scroll-velocity kick, entirely on the compositor:
      // translate and a hair of rotation, never touching path geometry.
      const driftX = Math.sin(elapsed * 0.15) * 14 + scrollVel * 0.6;
      const driftY = Math.cos(elapsed * 0.12) * 10 - scrollVel * 0.4;
      const rot1 = Math.sin(elapsed * 0.08) * 1.4;
      const rot2 = Math.cos(elapsed * 0.1) * 1.2;
      if (path1Ref.current) {
        path1Ref.current.style.transform = `translate3d(${driftX.toFixed(2)}px, ${driftY.toFixed(2)}px, 0) rotate(${rot1.toFixed(3)}deg)`;
      }
      if (path2Ref.current) {
        path2Ref.current.style.transform = `translate3d(${(-driftX * 0.8).toFixed(2)}px, ${(-driftY * 0.8).toFixed(2)}px, 0) rotate(${rot2.toFixed(3)}deg)`;
      }
    });

    return () => {
      stopRead();
      stopWrite();
      window.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, []);

  return (
    <div ref={wrapperRef} className="global-ribbon-wrapper" aria-hidden="true">
      <svg className="global-ribbon-svg" viewBox={viewBox} preserveAspectRatio="none">
        <defs>
          <linearGradient id="globalRibbonGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.02" />
            <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.14" />
            <stop offset="70%" stopColor="#818cf8" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="globalRibbonGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.02" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.01" />
          </linearGradient>
          <filter id="ribbonGlow" x="-4%" y="-20%" width="108%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          ref={path1Ref}
          d="M -100,200 C 500,100 900,700 1540,400"
          fill="none"
          stroke="url(#globalRibbonGrad1)"
          strokeWidth="42"
          strokeLinecap="round"
          filter="url(#ribbonGlow)"
        />
        <path
          ref={path2Ref}
          d="M -80,600 C 400,800 1000,200 1520,600"
          fill="none"
          stroke="url(#globalRibbonGrad2)"
          strokeWidth="28"
          strokeLinecap="round"
          filter="url(#ribbonGlow)"
        />
      </svg>
    </div>
  );
}
