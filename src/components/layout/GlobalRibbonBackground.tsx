import { useEffect, useRef, type JSX } from "react";

export function GlobalRibbonBackground(): JSX.Element {
  const path1Ref = useRef<SVGPathElement>(null);
  const path2Ref = useRef<SVGPathElement>(null);

  useEffect(() => {
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReduced) return;

    let rafId = 0;
    let startTime = performance.now();
    let lastScrollY = window.scrollY;
    let scrollVel = 0;
    let targetScrollVel = 0;

    const handleScroll = () => {
      const currentY = window.scrollY;
      targetScrollVel = (currentY - lastScrollY) * 0.15;
      lastScrollY = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    const animate = (now: number) => {
      const elapsed = (now - startTime) * 0.001; // seconds

      // Damped scroll velocity
      scrollVel += (targetScrollVel - scrollVel) * 0.1;
      targetScrollVel *= 0.92;

      const sy = window.scrollY;
      const w = window.innerWidth || 1440;
      const h = window.innerHeight || 900;

      // Organic wave control points for Ribbon 1
      const wave1A = Math.sin(elapsed * 0.8 + sy * 0.0015) * 80 + scrollVel * 1.5;
      const wave1B = Math.cos(elapsed * 0.6 + sy * 0.002) * 90 - scrollVel * 1.2;
      const wave1C = Math.sin(elapsed * 1.1 + sy * 0.001) * 70;

      // Ribbon 1 Path: smooth multi-segment Cubic Bezier flowing across viewport
      const p1X0 = -100;
      const p1Y0 = h * 0.25 + wave1A;
      const cp1X1 = w * 0.35;
      const cp1Y1 = h * 0.1 + wave1B;
      const cp1X2 = w * 0.65;
      const cp1Y2 = h * 0.75 + wave1C;
      const p1X3 = w + 100;
      const p1Y3 = h * 0.5 - wave1A * 0.5;

      const d1 = `M ${p1X0},${p1Y0} C ${cp1X1},${cp1Y1} ${cp1X2},${cp1Y2} ${p1X3},${p1Y3}`;

      // Organic wave control points for Ribbon 2 (Secondary accent ribbon with phase shift)
      const wave2A = Math.cos(elapsed * 0.7 + sy * 0.0012) * 65 - scrollVel * 1.8;
      const wave2B = Math.sin(elapsed * 0.9 + sy * 0.0018) * 85 + scrollVel * 1.4;

      const p2X0 = -80;
      const p2Y0 = h * 0.65 + wave2A;
      const cp2X1 = w * 0.3;
      const cp2Y1 = h * 0.85 - wave2B;
      const cp2X2 = w * 0.7;
      const cp2Y2 = h * 0.25 + wave2A;
      const p2X3 = w + 80;
      const p2Y3 = h * 0.7 - wave2B * 0.5;

      const d2 = `M ${p2X0},${p2Y0} C ${cp2X1},${cp2Y1} ${cp2X2},${cp2Y2} ${p2X3},${p2Y3}`;

      if (path1Ref.current) {
        path1Ref.current.setAttribute("d", d1);
      }
      if (path2Ref.current) {
        path2Ref.current.setAttribute("d", d2);
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="global-ribbon-wrapper" aria-hidden="true">
      <svg className="global-ribbon-svg" viewBox="0 0 1440 900" preserveAspectRatio="none">
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
          <filter id="ribbonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="16" result="blur" />
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
