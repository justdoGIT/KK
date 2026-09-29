import { useRef, useState, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  Vector3,
  type Group,
  type Mesh,
  type Points,
} from "three";
import turtlebotJoints from "../../robots/joints/turtlebot3.json";
import { jointRigFor } from "../../robots/model-assets.ts";
import { smoothstep } from "../career-timeline.ts";
import { useModelInstance } from "../robot-model.ts";
import { DepthCameraRig } from "../wall-follower/DepthCameraRig.tsx";
import {
  DEPTH_COLS,
  MOUNT_H,
  createSensorFrame,
  mountPose,
  senseInto,
  type SensorFrame,
} from "../wall-follower/depth-sensor.ts";
import { MazeWorld } from "../wall-follower/MazeWorld.tsx";
import { createPose, poseAt, runProgress, sharedMaze, type Maze, type Pose } from "../wall-follower/maze.ts";
import { cinematicLens } from "./stage-math.ts";
import type { StageProps } from "./registry.ts";

const WHEEL_R = 0.033;
const HALF_TRACK = 0.144;
const TRAIL = 240;

type Scratch = { pose: Pose; probe: Pose; frame: SensorFrame; cam: Vector3; look: Vector3; tmp: Vector3 };

function createScratch(): Scratch {
  return {
    pose: createPose(),
    probe: createPose(),
    frame: createSensorFrame(),
    cam: new Vector3(),
    look: new Vector3(),
    tmp: new Vector3(),
  };
}

function createTrail(maze: Maze): Line {
  const pose = createPose();
  const positions: number[] = [];
  for (let i = 0; i <= TRAIL; i += 1) {
    poseAt(maze, i / TRAIL, pose);
    positions.push(pose.x, 0.006, pose.z);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  return new Line(geometry, new LineBasicMaterial({ color: "#38bdf8", transparent: true, opacity: 0.85 }));
}

function hitGeometry(): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(new Float32Array(DEPTH_COLS * 3), 3));
  geometry.setAttribute("color", new Float32BufferAttribute(new Float32Array(DEPTH_COLS * 3), 3));
  return geometry;
}

/** Averaged heading around u so the chase camera glides through pivots. */
function chaseHeading(maze: Maze, u: number, probe: Pose): { fx: number; fz: number } {
  let fx = 0;
  let fz = 0;
  for (const offset of [-0.02, -0.01, 0, 0.01, 0.02]) {
    poseAt(maze, u + offset, probe);
    fx += Math.cos(probe.yaw);
    fz -= Math.sin(probe.yaw);
  }
  const len = Math.hypot(fx, fz) || 1;
  return { fx: fx / len, fz: fz / len };
}

/** Stage 0 (IFM Engineering): TurtleBot3 follows the right-hand wall out of the maze. */
export function WallFollowerStage({ clock, index }: StageProps): JSX.Element {
  const [maze] = useState(sharedMaze);
  const robot = useModelInstance("turtlebot3");
  const [trailLine] = useState(() => createTrail(maze));
  const [hits] = useState(hitGeometry);
  const scratch = useRef<Scratch | null>(null);
  const root = useRef<Group>(null);
  const bot = useRef<Group>(null);
  const line = useRef<Line>(null);
  const points = useRef<Points>(null);
  const corner = useRef<Mesh>(null);

  useFrame(({ camera }) => {
    const group = root.current;
    const c = clock.current;
    if (!group || !c) return;
    group.visible = c.stage === index;
    if (!group.visible) return;
    scratch.current ??= createScratch();
    const { pose, probe, frame, cam, look, tmp } = scratch.current;
    const u = runProgress(c.local);
    poseAt(maze, u, pose);
    bot.current?.position.set(pose.x, 0, pose.z);
    bot.current?.rotation.set(0, pose.yaw, 0);
    const rig = jointRigFor(robot.scene, turtlebotJoints);
    rig.set("wheel_left_joint", (pose.s - HALF_TRACK * pose.turn) / WHEEL_R);
    rig.set("wheel_right_joint", (pose.s + HALF_TRACK * pose.turn) / WHEEL_R);
    line.current?.geometry.setDrawRange(0, Math.max(2, Math.round(u * TRAIL)));

    senseInto(frame, pose, maze.walls);
    const mount = mountPose(pose);
    const fx = Math.cos(mount.yaw);
    const fz = -Math.sin(mount.yaw);
    const cloud = points.current?.geometry;
    if (cloud) {
      const position = cloud.getAttribute("position");
      const color = cloud.getAttribute("color");
      for (let col = 0; col < DEPTH_COLS; col += 1) {
        const ok = frame.valid[col] === 1;
        // Camera frame (x optical axis, y left) → world; left = (fz, -fx).
        const x = mount.x + fx * frame.rawX[col] + fz * frame.rawY[col];
        const z = mount.z + fz * frame.rawX[col] - fx * frame.rawY[col];
        position.setXYZ(col, x, ok ? MOUNT_H : -5, z);
        const amber = frame.cls[col] === 2;
        color.setXYZ(col, amber ? 0.98 : 0.22, amber ? 0.75 : 0.74, amber ? 0.14 : 0.97);
      }
      position.needsUpdate = true;
      color.needsUpdate = true;
    }
    if (corner.current) {
      corner.current.visible = frame.corner.active;
      const rc = Math.cos(pose.yaw);
      const rs = Math.sin(pose.yaw);
      // Robot frame (x forward, y left) → world.
      corner.current.position.set(
        pose.x + rc * frame.corner.x - rs * frame.corner.y,
        0.01,
        pose.z - rs * frame.corner.x - rc * frame.corner.y,
      );
    }

    // Camera: maze overview → chase → exit reveal.
    const heading = chaseHeading(maze, u, probe);
    const rightX = -heading.fz;
    const rightZ = heading.fx;
    cam.set(pose.x - heading.fx * 1.05 + rightX * 0.4, 1.75, pose.z - heading.fz * 1.05 + rightZ * 0.4);
    look.set(pose.x - heading.fx * 0.35, -0.25, pose.z - heading.fz * 0.35);
    const overview = 1 - smoothstep(0.03, 0.2, c.local);
    cam.lerp(tmp.set(0.2, 5.4, 4.6), overview);
    look.lerp(tmp.set(0, -0.6, 0.3), overview);
    const exit = smoothstep(0.86, 0.98, c.local);
    cam.lerp(tmp.set(maze.exit.x + 1.9, 0.75, maze.exit.z + 1.5), exit);
    look.lerp(tmp.set(pose.x, 0.12, pose.z), exit);
    camera.position.copy(cam);
    camera.lookAt(look);
    cinematicLens(camera, 38 + (1 - overview) * 8 - exit * 12);
  });

  return (
    <group ref={root}>
      <MazeWorld maze={maze} />
      <primitive ref={line} object={trailLine} />
      <points ref={points} geometry={hits} frustumCulled={false}>
        <pointsMaterial size={0.03} vertexColors toneMapped={false} />
      </points>
      <mesh ref={corner} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[0.05, 0.075, 32]} />
        <meshBasicMaterial color="#fbbf24" toneMapped={false} />
      </mesh>
      <group ref={bot}>
        <primitive object={robot.scene} />
        <DepthCameraRig />
      </group>
    </group>
  );
}
