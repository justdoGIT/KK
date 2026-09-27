import { Suspense, type JSX } from "react";
import { Canvas } from "@react-three/fiber";
import { SandToSiliconScene } from "./SandToSiliconScene.tsx";
import { isMobile } from "../useCapability.ts";

type CanvasImplProps = {
  currentStage: number;
};

export function CanvasImpl({ currentStage }: CanvasImplProps): JSX.Element {
  const mobile = isMobile();
  const dpr: [number, number] = mobile ? [1, 1] : [1, 1.5];

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
      <Suspense fallback={null}>
        <SandToSiliconScene currentStage={currentStage} />
      </Suspense>
    </Canvas>
  );
}
