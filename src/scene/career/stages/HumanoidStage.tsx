import { useCallback, useRef, useState, type JSX, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import { Mesh, Vector3, type Group } from "three";
import go2Joints from "../../robots/joints/go2.json";
import { jointRigFor } from "../../robots/model-assets.ts";
import { actProgress, morphProgress, smoothstep } from "../career-timeline.ts";
import { clipDuration, humanoidRigFor, poseHumanoid } from "../humanoid.ts";
import { useModelInstance } from "../robot-model.ts";
import { LEGS, createQuadPose, quadPoseAt } from "../terrain/quad-course.ts";
import { PartMorph } from "../transform/PartMorph.tsx";
import type { StageProps } from "./registry.ts";
import { MorphPad } from "./stage-kit.tsx";
import { activeClock, cinematicLens, orbit } from "./stage-math.ts";

const WALK_START = 0.35;
const WALK_DISTANCE = 6;
const STRIDE = 1.35;
const ARCHES = [2, 4, 6, 8];
/** Arch posts closer than this to the camera are culled; they would otherwise
 *  sweep through the frame as opaque slabs and eclipse the robot. */
const POST_CULL = 3.2;

function Runway({ postRefs }: { postRefs: RefObject<(Mesh | null)[]> }): JSX.Element {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[60, 30]} />
        <meshStandardMaterial color="#05080f" roughness={0.7} metalness={0.12} />
      </mesh>
      <Grid
        position={[0, 0.002, 0]}
        args={[40, 20]}
        cellSize={0.5}
        cellColor="#0e1a30"
        sectionSize={2}
        sectionColor="#1b3b66"
        fadeDistance={16}
      />
      {[-0.9, 0.9].map((z) => (
        <mesh key={z} position={[5, 0.01, z]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[12, 0.05]} />
          <meshBasicMaterial color="#38bdf8" toneMapped={false} />
        </mesh>
      ))}
      {ARCHES.map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          {[-2.1, 2.1].map((z, j) => (
            <mesh
              key={z}
              ref={(node) => {
                postRefs.current[i * 2 + j] = node;
              }}
              position={[0, 1.3, z]}
              castShadow
            >
              <boxGeometry args={[0.12, 2.6, 0.12]} />
              <meshStandardMaterial color="#111a2e" metalness={0.6} roughness={0.35} />
            </mesh>
          ))}
          <mesh position={[0, 2.62, 0]}>
            <boxGeometry args={[0.12, 0.08, 4.32]} />
            <meshStandardMaterial color="#0b1220" emissive="#93a4ff" emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Stage 3 (Vestel): the quadruped rebuilds into a humanoid that stands, scans, and walks the runway. */
export function HumanoidStage({ clock, index }: StageProps): JSX.Element {
  const go2 = useModelInstance("go2");
  const humanoid = useModelInstance("humanoid");
  const [rig] = useState(() => humanoidRigFor(humanoid));
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const postRefs = useRef<(Mesh | null)[]>([]);
  const scratch = useRef({ cam: new Vector3(), look: new Vector3(), tmp: new Vector3(), post: new Vector3() });

  const source = useCallback(() => {
    const stand = quadPoseAt(0, 0, createQuadPose());
    const legs = jointRigFor(go2.scene, go2Joints);
    LEGS.forEach((leg, i) => {
      legs.set(`${leg.name}_thigh_joint`, stand.joints[i * 2]);
      legs.set(`${leg.name}_calf_joint`, stand.joints[i * 2 + 1]);
    });
    go2.scene.position.set(0, stand.y, 0);
    return go2.scene;
  }, [go2]);
  const target = useCallback(() => {
    poseHumanoid(rig, [["Idle", 0, 1]]);
    rig.root.rotation.set(0, Math.PI / 2, 0);
    return rig.root;
  }, [rig]);

  useFrame(({ camera }) => {
    const c = activeClock(root.current, clock.current, index);
    if (!c) return;
    const { cam, look, tmp, post } = scratch.current;
    const morph = morphProgress(c.local);
    const u = actProgress(c.local);
    const walk = smoothstep(WALK_START - 0.08, WALK_START + 0.04, u);
    const distance = Math.max(0, (u - WALK_START) / (1 - WALK_START)) * WALK_DISTANCE;
    poseHumanoid(rig, [
      ["Idle", u * 6, 1 - walk],
      ["Walking", (distance / STRIDE) * clipDuration(rig, "Walking"), walk],
    ]);
    rig.root.rotation.set(0, Math.PI / 2, 0);
    if (body.current) {
      body.current.visible = morph >= 1;
      body.current.position.set(distance, 0, 0);
    }
    orbit(tmp, 0, 0, 1.2 - morph * 0.5, 3.2, 1.5);
    cam.copy(tmp);
    look.set(0, 0.9, 0);
    const track = smoothstep(0.02, 0.3, u);
    cam.lerp(tmp.set(distance + 3.3, 1.7, 4.6), track);
    look.lerp(tmp.set(distance + 0.2, 1.15, 0), track);
    camera.position.copy(cam);
    camera.lookAt(look);
    cinematicLens(camera, 42 - track * 7);
    for (const mesh of postRefs.current) {
      if (!mesh) continue;
      mesh.getWorldPosition(post);
      mesh.visible = post.distanceTo(camera.position) > POST_CULL;
    }
  });

  return (
    <group ref={root} visible={false}>
      <Runway postRefs={postRefs} />
      <MorphPad radius={1} position={[0, 0, 0]} />
      <PartMorph source={source} target={target} clock={clock} seed={37} />
      <group ref={body}>
        <primitive object={rig.root} />
      </group>
    </group>
  );
}
