import { Suspense, lazy, useState, type JSX } from "react";
import { checkWebGL } from "../useCapability.ts";
import { ROBOT_STAGES, type RobotStageId } from "./robot-stages.ts";

const CanvasImpl = lazy(() =>
  import("./RobotEvolutionCanvasImpl.tsx").then((m) => ({ default: m.RobotEvolutionCanvasImpl })),
);

type RobotEvolutionCanvasProps = {
  stageId: RobotStageId;
};

function CSSRobotFallback({ stageId }: { stageId: RobotStageId }): JSX.Element {
  const meta = ROBOT_STAGES[stageId] ?? ROBOT_STAGES[0];

  return (
    <div className="robot-css-fallback" aria-hidden="true">
      <div className="robot-fallback-core">
        <span className="robot-badge">{meta.codename}</span>
        <h4 className="robot-name">{meta.name}</h4>
        <span className="robot-era">{meta.era}</span>
      </div>
    </div>
  );
}

export function RobotEvolutionCanvas({ stageId }: RobotEvolutionCanvasProps): JSX.Element {
  const [webglSupported] = useState(() => checkWebGL());

  if (!webglSupported) {
    return (
      <div className="robot-canvas-container" aria-hidden="true">
        <CSSRobotFallback stageId={stageId} />
      </div>
    );
  }

  return (
    <div className="robot-canvas-container" aria-hidden="true">
      <Suspense fallback={<CSSRobotFallback stageId={stageId} />}>
        <CanvasImpl stageId={stageId} />
      </Suspense>
    </div>
  );
}
