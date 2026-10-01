import { type JSX } from "react";
import { Environment, Lightformer } from "@react-three/drei";

/**
 * Shared studio environment for the hero and silicon-fleet canvases: no HDR
 * download (CSP connect-src 'self'), just baked lightformer panels. Without
 * an environment, metallic/standard materials have nothing to reflect and
 * render near-black regardless of point-light intensity.
 */
export function SceneEnvironment(): JSX.Element {
  return (
    <Environment resolution={128}>
      <Lightformer intensity={0.8} position={[0, 0, -6]} scale={[12, 12, 1]} />
      <Lightformer intensity={0.55} position={[0, 6, 0]} scale={[10, 1, 10]} color="#dbeafe" />
      <Lightformer intensity={0.4} position={[6, 0, 2]} scale={[1, 10, 10]} color="#38bdf8" />
      <Lightformer intensity={0.3} position={[-6, 0, 2]} scale={[1, 10, 10]} color="#f59e0b" />
    </Environment>
  );
}
