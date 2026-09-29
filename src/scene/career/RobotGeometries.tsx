import { useMemo, useRef, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  DoubleSide,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Group,
  type Mesh,
} from "three";

// Shared materials for high-contrast dark luxury robotics look
function useRobotMaterials() {
  return useMemo(
    () => ({
      metalDark: new MeshStandardMaterial({ color: "#1e293b", roughness: 0.3, metalness: 0.8 }),
      metalLight: new MeshStandardMaterial({ color: "#94a3b8", roughness: 0.4, metalness: 0.6 }),
      chassis: new MeshStandardMaterial({ color: "#0f172a", roughness: 0.5, metalness: 0.5 }),
      accentCyan: new MeshStandardMaterial({ color: "#0284c7", roughness: 0.2, metalness: 0.9 }),
      gold: new MeshStandardMaterial({ color: "#d97706", roughness: 0.3, metalness: 0.9 }),
      glowCyan: new MeshBasicMaterial({ color: "#38bdf8", toneMapped: false }),
      glowRed: new MeshBasicMaterial({ color: "#ef4444", toneMapped: false }),
      glowGreen: new MeshBasicMaterial({ color: "#10b981", toneMapped: false }),
      glowAmber: new MeshBasicMaterial({ color: "#f59e0b", toneMapped: false }),
      shield: new MeshStandardMaterial({
        color: "#38bdf8",
        transparent: true,
        opacity: 0.25,
        blending: AdditiveBlending,
        side: DoubleSide,
      }),
    }),
    [],
  );
}

// STAGE 0: Wall Follower Bot (2-wheel differential chassis + IR sensors + wall)
export function WallFollowerBot(): JSX.Element {
  const mats = useRobotMaterials();
  const wheelLeft = useRef<Mesh>(null);
  const wheelRight = useRef<Mesh>(null);
  const led = useRef<Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (wheelLeft.current) wheelLeft.current.rotation.x = time * 4;
    if (wheelRight.current) wheelRight.current.rotation.x = time * 4;
    if (led.current) (led.current.material as MeshBasicMaterial).opacity = Math.sin(time * 8) > 0 ? 1 : 0.2;
  });

  return (
    <group position={[0, -0.4, 0]}>
      {/* Main PCB Chassis */}
      <mesh material={mats.chassis} position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 0.12, 32]} />
      </mesh>
      <mesh material={mats.accentCyan} position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.82, 0.82, 0.04, 32]} />
      </mesh>

      {/* Drive Wheels */}
      <mesh ref={wheelLeft} material={mats.metalDark} position={[-0.95, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.14, 24]} />
      </mesh>
      <mesh ref={wheelRight} material={mats.metalDark} position={[0.95, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.14, 24]} />
      </mesh>

      {/* Castor Wheel Rear */}
      <mesh material={mats.metalLight} position={[0, -0.05, -0.7]}>
        <sphereGeometry args={[0.15, 16, 16]} />
      </mesh>

      {/* Front IR Sensor Probes */}
      {[-0.4, -0.15, 0.15, 0.4].map((x, i) => (
        <group key={i} position={[x, 0.22, 0.82]}>
          <mesh material={mats.metalDark}>
            <boxGeometry args={[0.08, 0.12, 0.14]} />
          </mesh>
          <mesh material={mats.glowRed} position={[0, 0, 0.08]}>
            <sphereGeometry args={[0.03, 8, 8]} />
          </mesh>
        </group>
      ))}

      {/* Top Controller MCU Chip */}
      <mesh material={mats.metalDark} position={[0, 0.3, 0]}>
        <boxGeometry args={[0.4, 0.08, 0.4]} />
      </mesh>
      <mesh ref={led} material={mats.glowGreen} position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
      </mesh>
    </group>
  );
}

// STAGE 1: Obstacle Avoider Rover (4-wheel + spinning top LiDAR + pan-tilt camera)
export function ObstacleAvoiderRover(): JSX.Element {
  const mats = useRobotMaterials();
  const lidarDome = useRef<Group>(null);
  const camHead = useRef<Group>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (lidarDome.current) lidarDome.current.rotation.y = time * 6;
    if (camHead.current) camHead.current.rotation.y = Math.sin(time * 2) * 0.4;
  });

  return (
    <group position={[0, -0.3, 0]}>
      {/* Rover Main Body Box */}
      <mesh material={mats.chassis} position={[0, 0.3, 0]}>
        <boxGeometry args={[1.4, 0.45, 1.8]} />
      </mesh>
      <mesh material={mats.metalDark} position={[0, 0.55, 0]}>
        <boxGeometry args={[1.2, 0.1, 1.5]} />
      </mesh>

      {/* 4 Heavy Off-Road Wheels */}
      {[
        [-0.85, 0.15, 0.65],
        [0.85, 0.15, 0.65],
        [-0.85, 0.15, -0.65],
        [0.85, 0.15, -0.65],
      ].map((pos, i) => (
        <mesh key={i} material={mats.metalDark} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.22, 24]} />
        </mesh>
      ))}

      {/* Top Spinning LiDAR Tower */}
      <group ref={lidarDome} position={[0, 0.75, 0.3]}>
        <mesh material={mats.metalLight}>
          <cylinderGeometry args={[0.22, 0.25, 0.2, 24]} />
        </mesh>
        <mesh material={mats.glowCyan} position={[0.15, 0, 0]}>
          <boxGeometry args={[0.08, 0.04, 0.08]} />
        </mesh>
      </group>

      {/* Front Pan-Tilt Camera Head */}
      <group ref={camHead} position={[0, 0.7, 0.75]}>
        <mesh material={mats.accentCyan}>
          <boxGeometry args={[0.35, 0.22, 0.22]} />
        </mesh>
        <mesh material={mats.glowCyan} position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.04, 16]} />
        </mesh>
      </group>
    </group>
  );
}

// STAGE 2: Edge AI Systems Mesh (NPU Core + Articulated Legs + CAN Bus)
export function SystemsMeshBot(): JSX.Element {
  const mats = useRobotMaterials();
  const npuCore = useRef<Mesh>(null);
  const ring1 = useRef<Group>(null);
  const ring2 = useRef<Group>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (npuCore.current) {
      const s = 1 + Math.sin(time * 4) * 0.08;
      npuCore.current.scale.set(s, s, s);
    }
    if (ring1.current) ring1.current.rotation.z = time * 1.5;
    if (ring2.current) ring2.current.rotation.x = -time * 2;
  });

  return (
    <group position={[0, -0.2, 0]}>
      {/* Central Hex NPU Housing */}
      <mesh material={mats.chassis} position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.5, 6]} />
      </mesh>

      {/* Pulsing Glowing NPU Tensor Core */}
      <mesh ref={npuCore} material={mats.glowCyan} position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.35, 24, 24]} />
      </mesh>

      {/* Orbiting Telemetry Rings */}
      <group ref={ring1} position={[0, 0.4, 0]}>
        <mesh material={mats.shield}>
          <torusGeometry args={[0.95, 0.03, 12, 48]} />
        </mesh>
      </group>
      <group ref={ring2} position={[0, 0.4, 0]}>
        <mesh material={mats.shield}>
          <torusGeometry args={[1.15, 0.03, 12, 48]} />
        </mesh>
      </group>

      {/* 4 Articulated Robot Legs */}
      {[
        [-0.7, 0.2, 0.7, -0.8],
        [0.7, 0.2, 0.7, 0.8],
        [-0.7, 0.2, -0.7, -2.3],
        [0.7, 0.2, -0.7, 2.3],
      ].map(([x, y, z, rot], i) => (
        <group key={i} position={[x, y, z]} rotation={[0, rot, 0]}>
          <mesh material={mats.metalDark} position={[0.3, -0.2, 0]} rotation={[0, 0, -0.5]}>
            <boxGeometry args={[0.5, 0.1, 0.1]} />
          </mesh>
          <mesh material={mats.metalLight} position={[0.6, -0.5, 0]} rotation={[0, 0, 0.6]}>
            <boxGeometry args={[0.5, 0.08, 0.08]} />
          </mesh>
          <mesh material={mats.glowCyan} position={[0.75, -0.75, 0]}>
            <sphereGeometry args={[0.08, 12, 12]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// STAGE 3: Full Transformer Mech (Standing Humanoid Transformer)
export function TransformerMech(): JSX.Element {
  const mats = useRobotMaterials();
  const chestCore = useRef<Mesh>(null);
  const headGroup = useRef<Group>(null);
  const armLeft = useRef<Group>(null);
  const armRight = useRef<Group>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (chestCore.current) {
      const s = 1 + Math.sin(time * 5) * 0.12;
      chestCore.current.scale.set(s, s, s);
    }
    if (headGroup.current) {
      headGroup.current.rotation.y = Math.sin(time * 1.5) * 0.15;
    }
    if (armLeft.current && armRight.current) {
      armLeft.current.rotation.x = Math.sin(time * 2) * 0.1;
      armRight.current.rotation.x = -Math.sin(time * 2) * 0.1;
    }
  });

  return (
    <group position={[0, -1.1, 0]}>
      {/* Pelvis / Waist */}
      <mesh material={mats.chassis} position={[0, 0.8, 0]}>
        <boxGeometry args={[0.65, 0.35, 0.45]} />
      </mesh>
      <mesh material={mats.gold} position={[0, 0.8, 0.24]}>
        <boxGeometry args={[0.3, 0.15, 0.05]} />
      </mesh>

      {/* Heavy Torso Chest Armor */}
      <mesh material={mats.chassis} position={[0, 1.45, 0]}>
        <boxGeometry args={[1.1, 0.85, 0.65]} />
      </mesh>
      <mesh material={mats.accentCyan} position={[0, 1.55, 0.34]}>
        <boxGeometry args={[0.85, 0.55, 0.08]} />
      </mesh>

      {/* Pulsing Chest Reactor Core */}
      <mesh ref={chestCore} material={mats.glowCyan} position={[0, 1.55, 0.39]}>
        <sphereGeometry args={[0.22, 24, 24]} />
      </mesh>

      {/* Head Assembly + Optical Visor */}
      <group ref={headGroup} position={[0, 2.1, 0]}>
        <mesh material={mats.metalDark}>
          <boxGeometry args={[0.42, 0.38, 0.42]} />
        </mesh>
        <mesh material={mats.glowCyan} position={[0, 0.04, 0.22]}>
          <boxGeometry args={[0.34, 0.1, 0.04]} />
        </mesh>
        {/* Helmet Crest Antennas */}
        <mesh material={mats.gold} position={[-0.24, 0.2, 0]}>
          <boxGeometry args={[0.06, 0.3, 0.06]} />
        </mesh>
        <mesh material={mats.gold} position={[0.24, 0.2, 0]}>
          <boxGeometry args={[0.06, 0.3, 0.06]} />
        </mesh>
      </group>

      {/* Heavy Shoulder Pauldrons & Arms */}
      <group ref={armLeft} position={[-0.75, 1.75, 0]}>
        <mesh material={mats.accentCyan}>
          <boxGeometry args={[0.45, 0.45, 0.55]} />
        </mesh>
        <mesh material={mats.metalDark} position={[-0.1, -0.45, 0]}>
          <boxGeometry args={[0.3, 0.55, 0.3]} />
        </mesh>
        <mesh material={mats.metalLight} position={[-0.1, -0.95, 0]}>
          <boxGeometry args={[0.28, 0.5, 0.28]} />
        </mesh>
        {/* Hand */}
        <mesh material={mats.gold} position={[-0.1, -1.25, 0]}>
          <boxGeometry args={[0.18, 0.18, 0.22]} />
        </mesh>
      </group>

      <group ref={armRight} position={[0.75, 1.75, 0]}>
        <mesh material={mats.accentCyan}>
          <boxGeometry args={[0.45, 0.45, 0.55]} />
        </mesh>
        <mesh material={mats.metalDark} position={[0.1, -0.45, 0]}>
          <boxGeometry args={[0.3, 0.55, 0.3]} />
        </mesh>
        <mesh material={mats.metalLight} position={[0.1, -0.95, 0]}>
          <boxGeometry args={[0.28, 0.5, 0.28]} />
        </mesh>
        {/* Hand */}
        <mesh material={mats.gold} position={[0.1, -1.25, 0]}>
          <boxGeometry args={[0.18, 0.18, 0.22]} />
        </mesh>
      </group>

      {/* Leg Assemblies (Thighs + Shins + Boots) */}
      {[-0.32, 0.32].map((x, i) => (
        <group key={i} position={[x, 0.6, 0]}>
          <mesh material={mats.metalDark} position={[0, -0.35, 0]}>
            <boxGeometry args={[0.34, 0.65, 0.38]} />
          </mesh>

          <mesh material={mats.accentCyan} position={[0, -0.9, 0.05]}>
            <boxGeometry args={[0.38, 0.65, 0.42]} />
          </mesh>

          <mesh material={mats.chassis} position={[0, -1.3, 0.12]}>
            <boxGeometry args={[0.42, 0.22, 0.65]} />
          </mesh>
        </group>
      ))}

      {/* Back Wing Thrusters */}
      <group position={[0, 1.6, -0.4]}>
        <mesh material={mats.metalDark} position={[-0.45, 0.3, 0]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.15, 0.9, 0.3]} />
        </mesh>
        <mesh material={mats.metalDark} position={[0.45, 0.3, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.15, 0.9, 0.3]} />
        </mesh>
        <mesh material={mats.glowCyan} position={[-0.45, -0.2, 0]}>
          <cylinderGeometry args={[0.08, 0.04, 0.2, 16]} />
        </mesh>
        <mesh material={mats.glowCyan} position={[0.45, -0.2, 0]}>
          <cylinderGeometry args={[0.08, 0.04, 0.2, 16]} />
        </mesh>
      </group>
    </group>
  );
}
