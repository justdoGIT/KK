import { Suspense, lazy, useState, type JSX } from "react";
import { checkWebGL } from "../useCapability.ts";

const CanvasImpl = lazy(() =>
  import("./CanvasImpl.tsx").then((m) => ({ default: m.CanvasImpl })),
);

type SandToSiliconCanvasProps = {
  currentStage: number;
};

function CSSJourneyFallback({ currentStage }: { currentStage: number }): JSX.Element {
  const stageNames = [
    "01 // Quartz Sand Particles (SiO2)",
    "02 // 2000°C Arc Furnace & Oxygen Stripping",
    "03 // Czochralski Ingot & 300mm Wafer Slicing",
    "04 // EUV 13.5nm Lithography Transistors",
    "05 // QFP/BGA Packaging & First Boot Signal",
    "06 // Distributed Autonomous Fleet Mesh",
  ];

  return (
    <div className="journey-css-fallback" aria-hidden="true">
      <div className="css-orbit-ring" />
      <div className="css-core-orb" />
      <span className="css-stage-name">{stageNames[currentStage]}</span>
    </div>
  );
}

export function SandToSiliconCanvas({
  currentStage,
}: SandToSiliconCanvasProps): JSX.Element {
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
