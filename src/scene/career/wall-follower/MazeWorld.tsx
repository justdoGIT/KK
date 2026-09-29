import { useLayoutEffect, useRef, type JSX } from "react";
import { Grid } from "@react-three/drei";
import { Matrix4, type InstancedMesh } from "three";
import { CELL, MAZE_COLS, MAZE_ROWS, WALL_H, type Maze } from "./maze.ts";

const CAP_H = 0.012;

/** Instanced maze walls with glowing caps, a gridded floor, entrance pad, and exit gate. */
export function MazeWorld({ maze }: { maze: Maze }): JSX.Element {
  const walls = useRef<InstancedMesh>(null);
  const caps = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const matrix = new Matrix4();
    maze.walls.forEach((wall, i) => {
      matrix.makeScale(wall.w, WALL_H, wall.d).setPosition(wall.x, WALL_H / 2, wall.z);
      walls.current?.setMatrixAt(i, matrix);
      matrix.makeScale(wall.w, CAP_H, wall.d).setPosition(wall.x, WALL_H + CAP_H / 2, wall.z);
      caps.current?.setMatrixAt(i, matrix);
    });
    if (walls.current) walls.current.instanceMatrix.needsUpdate = true;
    if (caps.current) caps.current.instanceMatrix.needsUpdate = true;
  }, [maze]);

  const width = MAZE_COLS * CELL;
  const depth = MAZE_ROWS * CELL;

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[width + 8, depth + 8]} />
        <meshStandardMaterial color="#050912" roughness={0.82} metalness={0.15} />
      </mesh>
      <Grid
        position={[CELL / 2, 0.002, CELL / 2]}
        args={[width + 6, depth + 6]}
        cellSize={CELL / 4}
        cellThickness={0.5}
        cellColor="#10203a"
        sectionSize={CELL}
        sectionThickness={1}
        sectionColor="#1b3b66"
        fadeDistance={16}
        fadeStrength={1.4}
      />
      <instancedMesh ref={walls} args={[undefined, undefined, maze.walls.length]} castShadow receiveShadow>
        <boxGeometry />
        <meshStandardMaterial color="#111a2e" roughness={0.45} metalness={0.35} />
      </instancedMesh>
      <instancedMesh ref={caps} args={[undefined, undefined, maze.walls.length]}>
        <boxGeometry />
        <meshStandardMaterial color="#0b1220" emissive="#38bdf8" emissiveIntensity={0.9} />
      </instancedMesh>
      <mesh position={[maze.start.x - CELL * 0.45, 0.004, maze.start.z]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[CELL * 0.8, CELL * 0.7]} />
        <meshBasicMaterial color="#93a4ff" transparent opacity={0.18} />
      </mesh>
      <group position={[maze.exit.x + 0.06, 0, maze.exit.z]}>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[0, 0.3, (side * CELL) / 2]} castShadow>
            <boxGeometry args={[0.06, 0.6, 0.06]} />
            <meshStandardMaterial color="#0b1220" emissive="#38bdf8" emissiveIntensity={2.4} toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[0.06, 0.05, CELL + 0.06]} />
          <meshStandardMaterial color="#0b1220" emissive="#38bdf8" emissiveIntensity={2.4} toneMapped={false} />
        </mesh>
        <mesh position={[0.9, 0.004, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[1.7, CELL]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.12} />
        </mesh>
      </group>
    </group>
  );
}
