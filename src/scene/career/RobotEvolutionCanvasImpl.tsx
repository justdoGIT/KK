import { Suspense, type JSX } from "react";
import { Canvas } from "@react-three/fiber";
import { isMobile } from "../useCapability.ts";
import { RobotEvolutionScene } from "./RobotEvolutionScene.tsx";
import type { RobotStageId } from "./robot-stages.ts";

type RobotEvolutionCanvasImplProps = {
  stageId: RobotStageId;
};

export function RobotEvolutionCanvasImpl({ stageId }: RobotEvolutionCanvasImplProps): JSX.Element {
  const mobile = isMobile();
  const dpr: [number, number] = mobile ? [1, 1] : [1, 1.5];

  return (
    <Canvas
      dpr={dpr}
      camera={{
        position: [0, 0.4, 4.2],
        fov: 44,
      }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Suspense fallback={null}>
        <RobotEvolutionScene stageId={stageId} />
      </Suspense>
    </Canvas>
  );
}
