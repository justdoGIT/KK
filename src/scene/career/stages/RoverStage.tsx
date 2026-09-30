import { useCallback, useRef, useState, type JSX, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { Path, Shape, Vector3, type Group, type Mesh, type MeshBasicMaterial } from "three";
import huskyJoints from "../../robots/joints/husky.json";
import { jointRigFor } from "../../robots/model-assets.ts";
import { actProgress, morphProgress, smoothstep } from "../career-timeline.ts";
import { useModelInstance } from "../robot-model.ts";
import { ROVER_WHEEL_RADIUS, roverRideHeight } from "../rover-motion.ts";
import { HAZARDS, LIDAR_RANGE, ROVER_LENGTH, ROVER_PATH, ROVER_START } from "../terrain/rover-course.ts";
import { PartMorph } from "../transform/PartMorph.tsx";
import type { StageProps } from "./registry.ts";
import { MorphPad } from "./stage-kit.tsx";
import { activeClock, cinematicLens, orbit } from "./stage-math.ts";

const WHEELS = ["front_left_wheel", "front_right_wheel", "rear_left_wheel", "rear_right_wheel"];

function groundShape(): Shape {
  const shape = new Shape();
  shape.moveTo(-30, -18);
  shape.lineTo(30, -18);
  shape.lineTo(30, 18);
  shape.lineTo(-30, 18);
  shape.lineTo(-30, -18);
  for (const hazard of HAZARDS) {
    if (hazard.kind !== "pit") continue;
    // Shape lies in x/y before rotation; rotation -90° about X maps y → -z.
    const hole = new Path();
    hole.absarc(hazard.x, -hazard.z, hazard.r, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  return shape;
}

function Hazards({ rings }: { rings: RefObject<(Mesh | null)[]> }): JSX.Element {
  return (
    <>
      {HAZARDS.map((hazard, i) => (
        <group key={`${hazard.kind}-${hazard.x}`} position={[hazard.x, 0, hazard.z]}>
          {hazard.kind === "crate" && (
            <mesh position-y={0.35} rotation-y={0.4} castShadow receiveShadow>
              <boxGeometry args={[0.7, 0.7, 0.7]} />
              <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.2} />
              <Edges color="#38bdf8" />
            </mesh>
          )}
          {hazard.kind === "barrel" &&
            [
              [0, 0],
              [0.36, 0.12],
              [0.12, -0.34],
            ].map(([bx, bz]) => (
              <mesh key={`${bx}-${bz}`} position={[bx - 0.15, 0.32, bz]} castShadow receiveShadow>
                <cylinderGeometry args={[0.17, 0.17, 0.64, 24]} />
                <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.4} />
              </mesh>
            ))}
          {hazard.kind === "pit" && (
            <mesh position-y={-0.45}>
              <cylinderGeometry args={[hazard.r, hazard.r * 0.7, 0.9, 40, 1, true]} />
              <meshStandardMaterial color="#020617" side={1} roughness={1} />
            </mesh>
          )}
          <mesh
            ref={(mesh) => {
              rings.current[i] = mesh;
            }}
            rotation-x={-Math.PI / 2}
            position-y={0.01}
          >
            <ringGeometry args={[hazard.r + 0.08, hazard.r + 0.14, 64]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.15} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** Stage 1 (Capgemini): TurtleBot3 rebuilds into a Husky rover that slaloms past crates and pits. */
export function RoverStage({ clock, index }: StageProps): JSX.Element {
  const husky = useModelInstance("husky");
  const turtlebot = useModelInstance("turtlebot3");
  const [shape] = useState(groundShape);
  const root = useRef<Group>(null);
  const rover = useRef<Group>(null);
  const beam = useRef<Mesh>(null);
  const pulse = useRef<Mesh>(null);
  const rings = useRef<(Mesh | null)[]>([]);
  const scratch = useRef({ p: new Vector3(), t: new Vector3(), cam: new Vector3(), look: new Vector3(), tmp: new Vector3() });

  const source = useCallback(() => turtlebot.scene, [turtlebot]);
  const target = useCallback(() => husky.scene, [husky]);

  useFrame(({ camera }) => {
    const c = activeClock(root.current, clock.current, index);
    if (!c) return;
    const { p, t, cam, look, tmp } = scratch.current;
    const morph = morphProgress(c.local);
    const u = actProgress(c.local);
    ROVER_PATH.getPointAt(u, p);
    ROVER_PATH.getTangentAt(u, t);
    const s = u * ROVER_LENGTH;
    const body = rover.current;
    if (body) {
      body.visible = morph >= 1;
      body.position.set(p.x, roverRideHeight(s), p.z);
      body.rotation.set(Math.sin(s * 3.1) * 0.02, Math.atan2(-t.z, t.x), Math.sin(s * 2.3) * 0.025);
    }
    const rig = jointRigFor(husky.scene, huskyJoints);
    for (const wheel of WHEELS) rig.set(wheel, s / ROVER_WHEEL_RADIUS);
    if (beam.current) beam.current.rotation.y = s * 9;
    const sweep = (s * 0.9) % 1;
    if (pulse.current) {
      pulse.current.scale.setScalar(0.2 + sweep * LIDAR_RANGE);
      (pulse.current.material as MeshBasicMaterial).opacity = (1 - sweep) * 0.5 * (morph >= 1 ? 1 : 0);
    }
    HAZARDS.forEach((hazard, i) => {
      const ring = rings.current[i];
      if (!ring) return;
      const distance = Math.hypot(hazard.x - p.x, hazard.z - p.z) - hazard.r;
      const seen = morph >= 1 ? 1 - smoothstep(LIDAR_RANGE * 0.6, LIDAR_RANGE, distance) : 0;
      (ring.material as MeshBasicMaterial).opacity = 0.12 + seen * 0.88;
      ring.scale.setScalar(1 + seen * 0.08 * Math.sin(s * 12 + i));
    });

    orbit(tmp, ROVER_START.x, ROVER_START.z, 1.25 - morph * 0.7, 2.6, 1.35);
    cam.copy(tmp);
    look.set(ROVER_START.x, 0.3, ROVER_START.z);
    const track = smoothstep(0, 0.12, u);
    // High, pulled-back chase shot: a low camera passed through the crates and
    // let their boxes fill the frame.
    cam.lerp(tmp.set(p.x - 0.9, 3.1, p.z + 4.6), track);
    look.lerp(tmp.set(p.x + t.x * 0.7, 0.15, p.z + t.z * 0.7), track);
    camera.position.copy(cam);
    camera.lookAt(look);
    cinematicLens(camera, 48 - track * 10 + smoothstep(0.72, 1, u) * 6);
  });

  return (
    <group ref={root} visible={false}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <shapeGeometry args={[shape, 48]} />
        <meshStandardMaterial color="#0a101d" roughness={0.9} metalness={0.05} />
      </mesh>
      <Hazards rings={rings} />
      <MorphPad radius={0.9} position={[ROVER_START.x, 0, ROVER_START.z]} />
      <group position={[ROVER_START.x, roverRideHeight(0), ROVER_START.z]}>
        <PartMorph source={source} target={target} clock={clock} seed={11} />
      </group>
      <group ref={rover}>
        <primitive object={husky.scene} />
        <group position={[0.12, 0.42, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.07, 0.08, 0.09, 32]} />
            <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh ref={beam} position-y={0.02}>
            <boxGeometry args={[LIDAR_RANGE, 0.004, 0.012]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.55} toneMapped={false} />
          </mesh>
        </group>
        <mesh ref={pulse} rotation-x={-Math.PI / 2} position-y={0.02}>
          <ringGeometry args={[0.97, 1, 96]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
