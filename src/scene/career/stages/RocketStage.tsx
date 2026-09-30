import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { Grid, useGLTF } from "@react-three/drei";
import { Box3, Vector3, type Group } from "three";
import { modelUrl } from "../../robots/model-assets.ts";
import { applyPose, createPoseBuffer, sampleWalkPose } from "../../astronaut/astronaut-poses.ts";
import { buildAstronautRig, instantiateAstronaut } from "../../astronaut/astronaut-rig.ts";
import { actProgress, morphProgress, smoothstep } from "../career-timeline.ts";
import { useModelInstance } from "../robot-model.ts";
import { createLaunchTower, createRocket, ROCKET_HEIGHT } from "../rocket-model.ts";
import { humanoidRigFor, poseHumanoid } from "../humanoid.ts";
import { PartMorph } from "../transform/PartMorph.tsx";
import type { StageProps } from "./registry.ts";
import { MorphPad } from "./stage-kit.tsx";
import { activeClock, cinematicLens, orbit } from "./stage-math.ts";

/** Astronaut walk: from the right of the pad to the foot of the rocket. */
const WALK_FROM = 6.2;
const WALK_TO = 1.55;
const WALK: readonly [number, number] = [0.08, 0.82];
const STRIDE = 0.9; // world units per full leg cycle

/** Stage 4 (SYMX.AI): the humanoid rebuilds into a launch vehicle; an astronaut walks out to board it. */
export function RocketStage({ clock, index }: StageProps): JSX.Element {
  const humanoid = useModelInstance("humanoid");
  const [humanoidRig] = useState(() => humanoidRigFor(humanoid));
  const gltf = useGLTF(modelUrl("astronaut"), false, true);
  const rig = useMemo(() => buildAstronautRig(gltf.scene), [gltf.scene]);
  const astronaut = useMemo(() => instantiateAstronaut(rig), [rig]);
  const [rocket] = useState(createRocket);
  const [tower] = useState(createLaunchTower);
  const [pose] = useState(createPoseBuffer);
  // Feet-on-ground offset for the rig root, measured once in the walking pose.
  const footOffset = useMemo(() => {
    sampleWalkPose(0, pose);
    applyPose(astronaut, pose);
    astronaut.root.position.set(0, 0, 0);
    astronaut.root.rotation.set(0, 0, 0);
    astronaut.root.updateMatrixWorld(true);
    return -new Box3().setFromObject(astronaut.root, true).min.y;
  }, [astronaut, pose]);
  const root = useRef<Group>(null);
  const vehicle = useRef<Group>(null);
  const walker = useRef<Group>(null);
  const scratch = useRef({ cam: new Vector3(), look: new Vector3(), tmp: new Vector3() });

  useEffect(
    () => () => {
      for (const part of rig.parts) {
        part.geometry.dispose();
        part.material.dispose();
      }
    },
    [rig],
  );

  const source = useCallback(() => {
    poseHumanoid(humanoidRig, [["Idle", 0, 1]]);
    humanoidRig.root.position.set(0, 0, 0);
    humanoidRig.root.rotation.set(0, Math.PI / 2, 0);
    return humanoidRig.root;
  }, [humanoidRig]);
  const target = useCallback(() => rocket, [rocket]);

  useFrame(({ camera }) => {
    const c = activeClock(root.current, clock.current, index);
    if (!c) return;
    const { cam, look, tmp } = scratch.current;
    const morph = morphProgress(c.local);
    const u = actProgress(c.local);
    const walk = smoothstep(WALK[0], WALK[1], u);
    const x = WALK_FROM + (WALK_TO - WALK_FROM) * walk;
    const moving = u > WALK[0] && u < WALK[1] ? 1 : 0;

    if (vehicle.current) vehicle.current.visible = morph >= 1;
    if (walker.current) {
      walker.current.visible = morph >= 1;
      walker.current.position.set(x, footOffset, 0.9);
    }
    // Stride phase follows distance walked, so scrolling back walks him backwards.
    sampleWalkPose((((WALK_FROM - x) / STRIDE) * Math.PI * 2) * moving, pose);
    applyPose(astronaut, pose);
    astronaut.root.rotation.set(0, -Math.PI / 2 + 0.35 * (1 - moving), 0); // faces the rocket; turns to camera on arrival

    // Morph: wide orbit of the pad. Act: rocket, tower, and astronaut in one shot,
    // aimed high enough that the nose stays clear of the caption overlay.
    orbit(tmp, 0, 0, 1.2 - morph * 0.6, 11, 2.8);
    cam.copy(tmp);
    look.set(0, 2.7, 0);
    const track = smoothstep(0, 0.2, u);
    cam.lerp(tmp.set(x * 0.5 + 1.4, 2.8, 16 - walk * 2), track);
    look.lerp(tmp.set(x * 0.5 - 0.3, ROCKET_HEIGHT * 0.6, 0), track);
    camera.position.copy(cam);
    camera.lookAt(look);
    cinematicLens(camera, 40 - track * 4);
  });

  return (
    <group ref={root} visible={false}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[60, 30]} />
        <meshStandardMaterial color="#05080f" roughness={0.75} metalness={0.1} />
      </mesh>
      <Grid position={[0, 0.002, 0]} args={[40, 20]} cellSize={0.5} cellColor="#0e1a30" sectionSize={2} sectionColor="#1b3b66" fadeDistance={18} />
      <MorphPad radius={1.4} position={[0, 0, 0]} />
      <PartMorph source={source} target={target} clock={clock} seed={37} />
      <group ref={vehicle}>
        <primitive object={rocket} />
        <primitive object={tower} position={[-1.35, 0, -0.2]} />
      </group>
      <group ref={walker}>
        <primitive object={astronaut.root} />
      </group>
    </group>
  );
}
