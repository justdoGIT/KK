import { useFrame } from "@react-three/fiber";
import { Float, Lightformer } from "@react-three/drei";
import { useRef, type JSX } from "react";
import type { Group } from "three";
import {
  ObstacleAvoiderRover,
  SystemsMeshBot,
  TransformerMech,
  WallFollowerBot,
} from "./RobotGeometries.tsx";
import type { RobotStageId } from "./robot-stages.ts";

type RobotEvolutionSceneProps = {
  stageId: RobotStageId;
};

export function RobotEvolutionScene({ stageId }: RobotEvolutionSceneProps): JSX.Element {
  const stageGroupRef = useRef<Group>(null);

  useFrame((state) => {
    if (stageGroupRef.current) {
      const time = state.clock.elapsedTime;
      stageGroupRef.current.rotation.y = time * 0.4;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <hemisphereLight args={["#e2e8f0", "#090d16", 0.8]} />
      <directionalLight position={[4, 6, 5]} intensity={2.2} />
      <directionalLight position={[-4, 3, -4]} intensity={1.5} color="#38bdf8" />
      <pointLight position={[0, -0.5, 0]} intensity={15} distance={5} color="#38bdf8" />

      {/* Lightformer environment studio reflections */}
      <Lightformer form="rect" intensity={3} position={[0, 4, 3]} scale={[6, 2, 1]} />
      <Lightformer form="ring" intensity={2} color="#38bdf8" position={[0, 1, 4]} scale={2} />

      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <group ref={stageGroupRef}>
          {stageId === 0 && <WallFollowerBot />}
          {stageId === 1 && <ObstacleAvoiderRover />}
          {stageId === 2 && <SystemsMeshBot />}
          {stageId === 3 && <TransformerMech />}
        </group>
      </Float>

      {/* Grid Floor Marker */}
      <gridHelper args={[8, 16, "#38bdf8", "#1e293b"]} position={[0, -1.2, 0]} />
    </>
  );
}
