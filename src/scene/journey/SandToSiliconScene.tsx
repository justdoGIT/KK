import { type JSX } from "react";
import { MeteorGenesisStage } from "./MeteorGenesisStage.tsx";
import { ColdSiliconBringupStage } from "./ColdSiliconBringupStage.tsx";
import { KernelBootStage } from "./KernelBootStage.tsx";
import { PeripheralsRoboticsStage } from "./PeripheralsRoboticsStage.tsx";
import { EdgeAiNeuralStage } from "./EdgeAiNeuralStage.tsx";
import { FleetArmyStage } from "./FleetArmyStage.tsx";

type SandToSiliconSceneProps = {
  currentStage: number; // 0 to 5
};

export function SandToSiliconScene({ currentStage }: SandToSiliconSceneProps): JSX.Element {
  return (
    <>
      {/* Dynamic Lighting adapted for active stage */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 6]} intensity={1.6} />
      <pointLight position={[-4, 3, 3]} intensity={1.3} color="#38bdf8" />
      <pointLight position={[4, -4, -2]} intensity={1.1} color="#f59e0b" />

      {/* Act I: Meteor Shower & Desert Sand Genesis */}
      <MeteorGenesisStage active={currentStage === 0} />

      {/* Act II: Cold Silicon Bring-Up & Power Rail Cascades */}
      <ColdSiliconBringupStage active={currentStage === 1} />

      {/* Act III: U-Boot, Linux Kernel & Hardware Root-of-Trust */}
      <KernelBootStage active={currentStage === 2} />

      {/* Act IV: Sensor, Robotics & Wireless Peripherals Integration */}
      <PeripheralsRoboticsStage active={currentStage === 3} />

      {/* Act V: Edge AI Neural Quantization & Local NPU Inference */}
      <EdgeAiNeuralStage active={currentStage === 4} />

      {/* Act VI: The Autonomous Fleet Ascendancy (Army of Swarm Intelligence) */}
      <FleetArmyStage active={currentStage === 5} />
    </>
  );
}
