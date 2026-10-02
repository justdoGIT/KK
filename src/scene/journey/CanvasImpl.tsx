import { Suspense, type JSX } from "react";
import { Canvas } from "@react-three/fiber";
import { SiliconFleetScene } from "./SiliconFleetScene.tsx";
import { useAdaptiveDpr } from "../AdaptiveDpr.tsx";
import { SchedulerFrames } from "../SchedulerFrames.tsx";

type CanvasImplProps = {
  currentStage: number;
  /** Renders frames only while the section is actually on screen. */
  active: boolean;
};

export function CanvasImpl({ currentStage, active }: CanvasImplProps): JSX.Element {
  const { dpr, monitor } = useAdaptiveDpr();

  return (
    <Canvas
      dpr={dpr}
      frameloop="never"
      camera={{
        position: [0, 0, 4.8],
        fov: 46,
      }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      {monitor}
      <SchedulerFrames active={active} />
      <Suspense fallback={null}>
        <SiliconFleetScene currentStage={currentStage} />
      </Suspense>
    </Canvas>
  );
}
