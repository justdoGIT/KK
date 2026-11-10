import { Suspense, type JSX } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { SiliconFleetScene } from "./SiliconFleetScene.tsx";
import { useAdaptiveDpr } from "../AdaptiveDpr.tsx";
import { SchedulerFrames } from "../SchedulerFrames.tsx";
import { useMediaQuery } from "../../motion/use-media-query.ts";

type CanvasImplProps = {
  currentStage: number;
  /** Renders frames only while the section is actually on screen. */
  active: boolean;
};

function StageCamera({ compact, currentStage }: { compact: boolean; currentStage: number }): JSX.Element {
  const size = useThree(state => state.size);
  const baseFov = compact ? currentStage === 0 ? 34 : currentStage === 6 ? 48 : 40 : 46;
  // Canvas camera options initialize once. A declarative camera follows
  // each slide, preserving horizontal room when the scene becomes taller.
  const aspect = Math.max(.1, size.width / Math.max(1, size.height));
  const fov = compact
    ? Math.max(baseFov, 2 * Math.atan(Math.tan(baseFov * Math.PI / 360) / aspect) * 180 / Math.PI)
    : baseFov;
  return <PerspectiveCamera makeDefault position={[0, 0, 4.8]} fov={fov} />;
}

export function CanvasImpl({ currentStage, active }: CanvasImplProps): JSX.Element {
  const { dpr, monitor } = useAdaptiveDpr();
  const compact = useMediaQuery("(max-width: 767px)");

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
      <Suspense fallback={null}>
        <StageCamera compact={compact} currentStage={currentStage} />
        <SiliconFleetScene currentStage={currentStage} compact={compact} />
        <SchedulerFrames active={active} />
      </Suspense>
    </Canvas>
  );
}
