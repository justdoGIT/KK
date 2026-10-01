import { Suspense, type JSX } from "react";
import { Canvas } from "@react-three/fiber";
import { SiliconFleetScene } from "./SiliconFleetScene.tsx";
import { useAdaptiveDpr } from "../AdaptiveDpr.tsx";

type CanvasImplProps = {
  currentStage: number;
};

export function CanvasImpl({ currentStage }: CanvasImplProps): JSX.Element {
  const { dpr, monitor } = useAdaptiveDpr();

  return (
    <Canvas
      dpr={dpr}
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
      <Suspense fallback={null}>
        <SiliconFleetScene currentStage={currentStage} />
      </Suspense>
    </Canvas>
  );
}
