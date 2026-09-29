import { useCallback, useRef, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, Grid } from "@react-three/drei";
import { Vector3, type Group } from "three";
import go2Joints from "../../robots/joints/go2.json";
import { jointRigFor, type JointRig } from "../../robots/model-assets.ts";
import { actProgress, morphProgress, smoothstep } from "../career-timeline.ts";
import { useModelInstance } from "../robot-model.ts";
import { LEGS, QUAD_BLOCKS, QUAD_START, createQuadPose, quadPoseAt, type QuadPose } from "../terrain/quad-course.ts";
import { PartMorph } from "../transform/PartMorph.tsx";
import type { StageProps } from "./registry.ts";
import { MorphPad } from "./stage-kit.tsx";
import { activeClock, cinematicLens, orbit } from "./stage-math.ts";

const BLOCK_COLORS: Record<string, string> = {
  rubble: "#1e293b",
  stair: "#172036",
  platform: "#111a2e",
  block: "#1b2540",
};

/** Applies a solved quad pose to the Go2 joints (hips held level). */
function applyPose(rig: JointRig, pose: QuadPose): void {
  LEGS.forEach((leg, i) => {
    rig.set(`${leg.name}_hip_joint`, 0);
    rig.set(`${leg.name}_thigh_joint`, pose.joints[i * 2]);
    rig.set(`${leg.name}_calf_joint`, pose.joints[i * 2 + 1]);
  });
}

function Course(): JSX.Element {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[60, 30]} />
        <meshStandardMaterial color="#060a14" roughness={0.9} />
      </mesh>
      <Grid
        position={[0, 0.002, 0]}
        args={[40, 20]}
        cellSize={0.25}
        cellColor="#10203a"
        sectionSize={1}
        sectionColor="#1b3b66"
        fadeDistance={14}
        fadeStrength={1.5}
      />
      {QUAD_BLOCKS.map((block) => {
        const width = block.x1 - block.x0;
        const depth = block.kind === "rubble" ? 0.42 : 1.5;
        const rows = block.kind === "rubble" ? [-0.45, 0, 0.45] : [0];
        return rows.map((z, row) => (
          <mesh
            key={`${block.x0}-${row}`}
            position={[block.x0 + width / 2, block.top / 2, z + (block.kind === "rubble" ? ((block.x0 * 13 + row) % 0.12) - 0.06 : 0)]}
            rotation-y={block.kind === "rubble" ? ((block.x0 * 7 + row) % 0.5) - 0.25 : 0}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[width * (block.kind === "rubble" ? 1.05 : 1), block.top, depth]} />
            <meshStandardMaterial color={BLOCK_COLORS[block.kind]} roughness={0.7} metalness={0.2} />
            {block.kind !== "rubble" && <Edges color="#38bdf8" threshold={30} />}
          </mesh>
        ));
      })}
    </group>
  );
}

/** Stage 2 (Dozee): the rover rebuilds into a Go2 that trots over rubble, stairs and uneven blocks. */
export function QuadrupedStage({ clock, index }: StageProps): JSX.Element {
  const go2 = useModelInstance("go2");
  const husky = useModelInstance("husky");
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const scratch = useRef({ pose: createQuadPose(), cam: new Vector3(), look: new Vector3(), tmp: new Vector3() });

  const source = useCallback(() => husky.scene, [husky]);
  const target = useCallback(() => {
    const stand = quadPoseAt(0, 0, createQuadPose());
    applyPose(jointRigFor(go2.scene, go2Joints), stand);
    go2.scene.position.set(0, stand.y, 0);
    return go2.scene;
  }, [go2]);

  useFrame(({ camera }) => {
    const c = activeClock(root.current, clock.current, index);
    if (!c) return;
    const { pose, cam, look, tmp } = scratch.current;
    const morph = morphProgress(c.local);
    const u = actProgress(c.local);
    quadPoseAt(u, smoothstep(0, 0.05, u), pose);
    applyPose(jointRigFor(go2.scene, go2Joints), pose);
    go2.scene.position.set(0, 0, 0);
    if (body.current) {
      body.current.visible = morph >= 1;
      body.current.position.set(pose.x, pose.y, 0);
      body.current.rotation.set(0, 0, pose.pitch);
    }
    orbit(tmp, QUAD_START, 0, 1.3 - morph * 0.6, 1.9, 0.9);
    cam.copy(tmp);
    look.set(QUAD_START, 0.25, 0);
    const track = smoothstep(0, 0.1, u);
    cam.lerp(tmp.set(pose.x - 0.9, pose.y + 0.75, 2.2), track);
    look.lerp(tmp.set(pose.x + 0.5, pose.y - 0.1, 0), track);
    camera.position.copy(cam);
    camera.lookAt(look);
    cinematicLens(camera, 45 - track * 10);
  });

  return (
    <group ref={root} visible={false}>
      <Course />
      <MorphPad radius={0.75} position={[QUAD_START, 0, 0]} />
      <group position={[QUAD_START, 0, 0]}>
        <PartMorph source={source} target={target} clock={clock} seed={23} />
      </group>
      <group ref={body}>
        <primitive object={go2.scene} />
      </group>
    </group>
  );
}
