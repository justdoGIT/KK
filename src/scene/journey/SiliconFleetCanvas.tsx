import { Suspense, lazy, useState, type JSX } from "react";
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

  if (!webglSupported) {
    return (
      <div className="sand-canvas-container" aria-hidden="true">
        <CSSJourneyFallback currentStage={currentStage} />
      </div>
    );
  }

  return (
    <div className="sand-canvas-container" aria-hidden="true">
      <Suspense fallback={<CSSJourneyFallback currentStage={currentStage} />}>
        <CanvasImpl currentStage={currentStage} />
      </Suspense>
    </div>
  );
}
