import { type JSX } from "react";
import { Environment, Lightformer } from "@react-three/drei";

/** Studio light rig for the EMU suit: soft environment, sky/ground fill, key and a violet back fill. */
export function SuitLighting(): JSX.Element {
  return (
    <>
      <Environment resolution={128}>
        <Lightformer intensity={0.7} position={[0, 0, -5]} scale={[10, 10, 1]} />
        <Lightformer intensity={0.5} position={[0, 5, 0]} scale={[10, 1, 10]} />
        <Lightformer intensity={0.35} position={[5, 0, 0]} scale={[1, 10, 10]} />
      </Environment>
      <ambientLight intensity={0.38} />
      <hemisphereLight args={["#e3eaff", "#090d16", 0.85]} />
      <directionalLight position={[3, 4, 6]} intensity={2.5} />
      <directionalLight position={[-2, 1, -5]} intensity={0.75} color="#93a4ff" />
    </>
  );
}
