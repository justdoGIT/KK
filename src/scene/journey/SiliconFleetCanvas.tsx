import { Suspense, lazy, useEffect, useRef, useState, type JSX } from "react";
import { checkWebGL } from "../useCapability.ts";
import { boardLifecycle } from "../../content/board-lifecycle.ts";

const CanvasImpl = lazy(() =>
  import("./CanvasImpl.tsx").then((m) => ({ default: m.CanvasImpl })),
);

type SiliconFleetCanvasProps = {
  currentStage: number;
};

function CSSJourneyFallback({ currentStage }: { currentStage: number }): JSX.Element {

  return (
    <div className="journey-css-fallback" aria-hidden="true">
      <div className="css-orbit-ring" />
      <div className="css-core-orb" />
      <span className="css-stage-name">{boardLifecycle[currentStage].signal}</span>
    </div>
  );
}

export function SiliconFleetCanvas({
  currentStage,
}: SiliconFleetCanvasProps): JSX.Element {
  const [webglSupported] = useState(() => checkWebGL());
  const containerRef = useRef<HTMLDivElement>(null);
  // Mounted only once this section is near the viewport: this canvas's own
  // WebGL context and render loop otherwise ran for the whole page, even
  // while scrolled many screens away.
  const [near, setNear] = useState(false);
  // Frames follow actual visibility: between the 100% margin and the
  // viewport edge the canvas stays mounted (no context churn) but stops
  // rendering.
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const nearObserver = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      rootMargin: "100% 0px",
    });
    const activeObserver = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    nearObserver.observe(el);
    activeObserver.observe(el);
    return () => {
      nearObserver.disconnect();
      activeObserver.disconnect();
    };
  }, []);

  if (!webglSupported || !near) {
    return (
      <div ref={containerRef} className="sand-canvas-container" aria-hidden="true">
        <CSSJourneyFallback currentStage={currentStage} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="sand-canvas-container" aria-hidden="true">
      <Suspense fallback={<CSSJourneyFallback currentStage={currentStage} />}>
        <CanvasImpl currentStage={currentStage} active={active} />
      </Suspense>
    </div>
  );
}
