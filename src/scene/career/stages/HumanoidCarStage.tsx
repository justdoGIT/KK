import { useCallback, useRef, useState, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, type Group, type LineSegments, type Mesh, type SpotLight } from "three";
import { clamp01, smoothstep } from "../career-timeline.ts";
import { carRigFor, clipDuration, humanoidRigFor, poseHumanoid, spinCarWheels } from "../humanoid.ts";
import { useModelInstance } from "../robot-model.ts";
import { PartMorph } from "../transform/PartMorph.tsx";
import type { StageProps } from "./registry.ts";
import { activeClock, cinematicLens, orbit } from "./stage-math.ts";
import { Road, SpeedLines } from "./road-set.tsx";
import { updateSpeedLines } from "./speed-lines.ts";

const RUN_FROM = -14;
const RUN_TO = -2;
const RUN_END = 0.5;
const MORPH: readonly [number, number] = [0.5, 0.82];
const RUN_STRIDE = 2.4;
const DRIVE_TO = 10;
const WHEEL_R = 0.3;

function runProgress(local: number): number {
  return clamp01((local - 0.04) / (RUN_END - 0.04));
}

/** Stage 4 (SYMX.AI): the humanoid sprints at the viewer, folds, and transforms into a supercar. */
export function HumanoidCarStage({ clock, index }: StageProps): JSX.Element {
  const humanoid = useModelInstance("humanoid");
  const carModel = useModelInstance("sportsCar");
  const [rig] = useState(() => humanoidRigFor(humanoid));
  const [car] = useState(() => carRigFor(carModel));
  const root = useRef<Group>(null);
  const runner = useRef<Group>(null);
  const vehicle = useRef<Group>(null);
  const lines = useRef<LineSegments>(null);
  const trails = useRef<(Mesh | null)[]>([]);
  const headlight = useRef<SpotLight>(null);
  const scratch = useRef({ cam: new Vector3(), look: new Vector3(), tmp: new Vector3() });

  const runTime = (run: number) => (((RUN_TO - RUN_FROM) * run) / RUN_STRIDE) * clipDuration(rig, "Running");
  const source = useCallback(() => {
    poseHumanoid(rig, [["Running", (((RUN_TO - RUN_FROM) * 1) / RUN_STRIDE) * clipDuration(rig, "Running"), 1]]);
    rig.root.position.set(0, 0, 0);
    return rig.root;
  }, [rig]);
  const target = useCallback(() => {
    car.root.position.set(0, 0, 0);
    return car.root;
  }, [car]);

  useFrame(({ camera }) => {
    const c = activeClock(root.current, clock.current, index);
    if (!c) return;
    const { cam, look, tmp } = scratch.current;
    const run = runProgress(c.local);
    const morph = clamp01((c.local - MORPH[0]) / (MORPH[1] - MORPH[0]));
    const drive = smoothstep(MORPH[1], 1, c.local) ** 1.6;
    const hz = RUN_FROM + (RUN_TO - RUN_FROM) * run;
    const running = smoothstep(0, 0.06, run);
    poseHumanoid(rig, [
      ["Idle", c.local * 8, 1 - running],
      ["Running", runTime(run), running],
    ]);
    rig.root.position.set(0, 0, 0);
    if (runner.current) {
      runner.current.visible = c.local < MORPH[0];
      runner.current.position.set(0, 0, hz);
    }
    const cz = RUN_TO + (DRIVE_TO - RUN_TO) * drive;
    car.root.position.set(0, 0, 0);
    if (vehicle.current) {
      vehicle.current.visible = morph >= 1;
      vehicle.current.position.set(0, 0, cz);
    }
    spinCarWheels(car, (cz - RUN_TO) / WHEEL_R);
    trails.current.forEach((trail, i) => {
      if (!trail) return;
      const length = Math.min(cz - RUN_TO, 7);
      trail.visible = morph >= 1 && length > 0.05;
      trail.scale.set(Math.max(length, 0.001), 1, 1);
      trail.position.set(i === 0 ? -0.62 : 0.62, 0.74, cz - 2.05 - length / 2);
    });
    if (headlight.current) headlight.current.intensity = morph >= 1 ? 16 : 0;
    updateSpeedLines(lines.current, hz, running * (1 - smoothstep(0.85, 1, run)));

    // Low tracking shot on the sprint → orbit during the transform → drive-by.
    cam.set(0.9, 0.7, hz + 3.6 - 1.7 * run);
    look.set(0, 1.05, hz);
    const orbitMix = smoothstep(MORPH[0] - 0.02, MORPH[0] + 0.06, c.local);
    orbit(tmp, 0, RUN_TO, Math.PI / 2 + 0.95 - morph * 1.5, 5.4, 1.7 - morph * 0.6);
    cam.lerp(tmp, orbitMix);
    look.lerp(tmp.set(0, 0.7, RUN_TO), orbitMix);
    const driveMix = smoothstep(MORPH[1], MORPH[1] + 0.06, c.local);
    cam.lerp(tmp.set(3.1, 0.75, 5.5), driveMix);
    look.lerp(tmp.set(0, 0.55, cz), driveMix);
    camera.position.copy(cam);
    camera.lookAt(look);
    cinematicLens(camera, 50 - orbitMix * 16 + driveMix * 10);
  });

  return (
    <group ref={root} visible={false}>
      <Road />
      <SpeedLines ref={lines} />
      <group ref={runner}>
        <primitive object={rig.root} />
      </group>
      <group position={[0, 0, RUN_TO]}>
        <PartMorph source={source} target={target} clock={clock} range={MORPH} seed={53} />
      </group>
      <group ref={vehicle}>
        <primitive object={car.root} />
        <spotLight ref={headlight} position={[0, 0.6, 2]} angle={0.5} penumbra={0.6} distance={18} color="#e0f2fe">
          <object3D attach="target" position={[0, 0, 12]} />
        </spotLight>
        <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[2.1, 4.4]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.22} toneMapped={false} />
        </mesh>
      </group>
      {[0, 1].map((i) => (
        <mesh
          key={i}
          ref={(mesh) => {
            trails.current[i] = mesh;
          }}
          rotation-y={Math.PI / 2}
        >
          <planeGeometry args={[1, 0.07]} />
          <meshBasicMaterial color="#f43f5e" transparent opacity={0.7} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
