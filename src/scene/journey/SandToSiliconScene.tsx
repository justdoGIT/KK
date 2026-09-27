import { type JSX } from "react";
import { SandStage } from "./SandStage.tsx";
import { HeatFurnaceStage } from "./HeatFurnaceStage.tsx";
import { IngotWaferStage } from "./IngotWaferStage.tsx";
import { LithographyStage } from "./LithographyStage.tsx";
import { PackagingBoardStage } from "./PackagingBoardStage.tsx";
import { FleetIntelligenceStage } from "./FleetIntelligenceStage.tsx";

type SandToSiliconSceneProps = {
  currentStage: number; // 0 to 5
};

export function SandToSiliconScene({ currentStage }: SandToSiliconSceneProps): JSX.Element {
  return (
    <>
      {/* Studio Lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 6]} intensity={1.5} />
      <pointLight position={[-4, 3, 3]} intensity={1.2} color="#38bdf8" />
      <pointLight position={[4, -4, -2]} intensity={1.0} color="#f59e0b" />

      {/* Stage 0: Desert Quartz Sand */}
      <SandStage active={currentStage === 0} />

      {/* Stage 1: Arc Furnace & Oxygen Stripping */}
      <HeatFurnaceStage active={currentStage === 1} />

      {/* Stage 2: Monocrystalline Ingot & Wafer Slicing */}
      <IngotWaferStage active={currentStage === 2} />

      {/* Stage 3: Photolithography & EUV Laser Etching */}
      <LithographyStage active={currentStage === 3} />

      {/* Stage 4: Die Packaging & First Board Bring-Up */}
      <PackagingBoardStage active={currentStage === 4} />

      {/* Stage 5: Autonomous Fleet Intelligence */}
      <FleetIntelligenceStage active={currentStage === 5} />
    </>
  );
}
