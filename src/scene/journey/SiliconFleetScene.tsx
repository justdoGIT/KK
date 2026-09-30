import { type JSX } from "react";
import { ColdSiliconBringupStage } from "./ColdSiliconBringupStage.tsx";
import { BoardStackStage } from "./BoardStackStage.tsx";
import { FleetArmyStage } from "./FleetArmyStage.tsx";

type SiliconFleetSceneProps = { currentStage: number }; // index into boardLifecycle (0–6)

export function SiliconFleetScene({ currentStage }: SiliconFleetSceneProps): JSX.Element {
  const stacking = currentStage >= 1 && currentStage <= 5;
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 6]} intensity={1.6} />
      <pointLight position={[-4, 3, 3]} intensity={1.3} color="#38bdf8" />
      <pointLight position={[4, -4, -2]} intensity={1.1} color="#f59e0b" />

      {/* 0: silicon, PCB, and power sequencing on a bare board. */}
      <ColdSiliconBringupStage active={currentStage === 0} />

      {/* 1–5: flash → bootloader → kernel → userspace → applications stack up. */}
      {stacking && <BoardStackStage built={currentStage} />}

      {/* 6: the finished device multiplied into a monitored fleet (scaled to fit the half-width canvas). */}
      <group scale={0.62}>
        <FleetArmyStage active={currentStage === 6} />
      </group>
    </>
  );
}
