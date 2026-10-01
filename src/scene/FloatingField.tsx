import { useRef, useMemo, useEffect, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PcbModule } from "./components/PcbModule.tsx";
import { MicrocontrollerQfp } from "./components/MicrocontrollerQfp.tsx";
import { AiTensorProcessor } from "./components/AiTensorProcessor.tsx";
import { RoboticGearWheel } from "./components/RoboticGearWheel.tsx";
import { ElectrolyticCapacitor } from "./components/ElectrolyticCapacitor.tsx";
import { AxialResistor } from "./components/AxialResistor.tsx";
import { RoboticActuatorMotor } from "./components/RoboticActuatorMotor.tsx";
import { SiliconWaferDisc } from "./components/SiliconWaferDisc.tsx";
import { SchematicHologramCard } from "./components/SchematicHologramCard.tsx";

type FloatingItemConfig = {
  basePos: [number, number, number];
  baseRot: [number, number, number];
  scale: number;
  bobSpeed: number;
  bobAmp: number;
  rotSpeed: [number, number, number];
  phase: number;
};

const ITEMS_CONFIG: FloatingItemConfig[] = [
  // 0: Main SoC QFP Microcontroller (Center stage)
  {
    basePos: [0.6, -0.15, 0.4],
    baseRot: [0.35, -0.45, 0.15],
    scale: 0.95,
    bobSpeed: 1.1,
    bobAmp: 0.16,
    rotSpeed: [0.08, 0.14, 0.05],
    phase: 0.0,
  },
  // 1: PCB Module with Gold Traces & SMT Passives (Top right)
  {
    basePos: [1.9, 0.95, -0.2],
    baseRot: [-0.3, 0.4, -0.2],
    scale: 0.82,
    bobSpeed: 0.9,
    bobAmp: 0.2,
    rotSpeed: [0.06, -0.1, 0.04],
    phase: 1.4,
  },
  // 2: AI Tensor Core / NPU Accelerator BGA (Bottom right)
  {
    basePos: [2.1, -1.05, 0.1],
    baseRot: [0.4, 0.5, -0.15],
    scale: 0.88,
    bobSpeed: 1.3,
    bobAmp: 0.18,
    rotSpeed: [-0.07, 0.12, 0.06],
    phase: 2.8,
  },
  // 3: Robotic Gear Wheel with Precision Teeth (Left/center)
  {
    basePos: [-0.85, -0.9, -0.3],
    baseRot: [1.1, 0.3, -0.4],
    scale: 0.9,
    bobSpeed: 0.85,
    bobAmp: 0.22,
    rotSpeed: [0.04, 0.18, -0.05],
    phase: 3.9,
  },
  // 4: Electrolytic Power Capacitor (Upper left)
  {
    basePos: [-1.4, 0.75, -0.4],
    baseRot: [0.6, -0.5, 0.7],
    scale: 0.85,
    bobSpeed: 1.05,
    bobAmp: 0.19,
    rotSpeed: [0.12, 0.08, -0.1],
    phase: 4.7,
  },
  // 5: Axial Color-Banded Resistor (Top center)
  {
    basePos: [0.3, 1.35, -0.35],
    baseRot: [0.2, 0.8, -0.6],
    scale: 0.9,
    bobSpeed: 1.2,
    bobAmp: 0.15,
    rotSpeed: [-0.09, 0.15, 0.08],
    phase: 5.5,
  },
  // 6: Robotic Actuator Motor (Far right backdrop)
  {
    basePos: [3.1, 0.1, -0.9],
    baseRot: [-0.2, -0.7, 0.3],
    scale: 0.75,
    bobSpeed: 0.75,
    bobAmp: 0.25,
    rotSpeed: [0.05, -0.08, 0.03],
    phase: 0.8,
  },
  // 7: Silicon Wafer Disc (Depth background)
  {
    basePos: [-0.25, -0.6, -1.3],
    baseRot: [0.8, 0.2, -0.3],
    scale: 0.8,
    bobSpeed: 0.7,
    bobAmp: 0.2,
    rotSpeed: [0.03, 0.09, 0.02],
    phase: 2.1,
  },
  // 8: Schematic Hologram Card (Upper right glow)
  {
    basePos: [1.1, 1.25, -0.7],
    baseRot: [-0.15, 0.35, -0.1],
    scale: 0.8,
    bobSpeed: 1.0,
    bobAmp: 0.17,
    rotSpeed: [0.04, 0.06, -0.03],
    phase: 3.3,
  },
];

type ItemDynamics = {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  rotVel: THREE.Vector3;
};

export function FloatingField(): JSX.Element {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);

  // Physics dynamic state for each item (position & angular spring velocities)
  const dynamics = useMemo<ItemDynamics[]>(() => {
    return ITEMS_CONFIG.map((cfg) => ({
      pos: new THREE.Vector3(...cfg.basePos),
      vel: new THREE.Vector3(0, 0, 0),
      rot: new THREE.Euler(...cfg.baseRot),
      rotVel: new THREE.Vector3(0, 0, 0),
    }));
  }, []);

  const pointerPos = useRef(new THREE.Vector2(0, 0));
  const pointerWorld = useRef(new THREE.Vector3(0, 0, 0));
  const mouseTarget = useRef(new THREE.Vector2(0, 0));
  const mouseWindow = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseWindow.current = { x: nx, y: ny, active: true };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const clampedDelta = Math.min(0.1, delta);
    const targetPtr = mouseWindow.current.active
      ? mouseTarget.current.set(mouseWindow.current.x, mouseWindow.current.y)
      : state.pointer;

    // Map pointer coordinates to 3D interaction plane
    pointerPos.current.lerp(targetPtr, 0.14);
    pointerWorld.current.set(
      pointerPos.current.x * 3.5,
      pointerPos.current.y * 2.5,
      0,
    );

    ITEMS_CONFIG.forEach((cfg, idx) => {
      const group = groupRefs.current[idx];
      const dyn = dynamics[idx];
      if (!group || !dyn) return;

      // 1. Idle sinusoidal floating motion
      const idleY =
        cfg.basePos[1] +
        Math.sin(time * cfg.bobSpeed + cfg.phase) * cfg.bobAmp +
        Math.cos(time * cfg.bobSpeed * 0.5 + cfg.phase * 1.5) * (cfg.bobAmp * 0.4);
      const idleX =
        cfg.basePos[0] +
        Math.cos(time * cfg.bobSpeed * 0.7 + cfg.phase) * (cfg.bobAmp * 0.5);
      const idleZ =
        cfg.basePos[2] +
        Math.sin(time * cfg.bobSpeed * 0.6 + cfg.phase * 0.8) * (cfg.bobAmp * 0.3);

      // Plain numbers, not a Vector3: this target is only ever read/added to
      // in this scope, so a per-item-per-frame allocation bought nothing.
      let targetX = idleX;
      let targetY = idleY;
      let targetZ = idleZ;

      // 2. Interactive Cursor Repulsion & Ripple Impulse
      const dx = targetX - pointerWorld.current.x;
      const dy = targetY - pointerWorld.current.y;
      const distSq = dx * dx + dy * dy;
      const influenceRadius = 2.4;

      if (distSq < influenceRadius * influenceRadius) {
        const dist = Math.max(0.2, Math.sqrt(distSq));
        const factor = (1 - dist / influenceRadius) * 0.6;
        const pushForce = factor * 0.8;

        // Push outwards and lift along z
        targetX += (dx / dist) * pushForce;
        targetY += (dy / dist) * pushForce;
        targetZ += factor * 0.4;

        // Dynamic tilt torque from cursor interaction
        dyn.rotVel.x += (dy / dist) * factor * 0.8 * clampedDelta;
        dyn.rotVel.y -= (dx / dist) * factor * 0.8 * clampedDelta;
      }

      // 3. Spring-damper physics for position
      const springStiffness = 14.0;
      const springDamping = 4.5;
      const forceX = (targetX - dyn.pos.x) * springStiffness - dyn.vel.x * springDamping;
      const forceY = (targetY - dyn.pos.y) * springStiffness - dyn.vel.y * springDamping;
      const forceZ = (targetZ - dyn.pos.z) * springStiffness - dyn.vel.z * springDamping;

      dyn.vel.x += forceX * clampedDelta;
      dyn.vel.y += forceY * clampedDelta;
      dyn.vel.z += forceZ * clampedDelta;

      dyn.pos.x += dyn.vel.x * clampedDelta;
      dyn.pos.y += dyn.vel.y * clampedDelta;
      dyn.pos.z += dyn.vel.z * clampedDelta;

      group.position.copy(dyn.pos);

      // 4. Rotational drift & angular spring integration
      dyn.rot.x += (cfg.rotSpeed[0] + dyn.rotVel.x) * clampedDelta;
      dyn.rot.y += (cfg.rotSpeed[1] + dyn.rotVel.y) * clampedDelta;
      dyn.rot.z += (cfg.rotSpeed[2] + dyn.rotVel.z) * clampedDelta;

      dyn.rotVel.multiplyScalar(Math.max(0, 1 - 3.5 * clampedDelta));

      group.rotation.copy(dyn.rot);
    });
  });

  return (
    <group>
      {/* 0: Qualcomm / ARM SoC Microcontroller */}
      <group
        ref={(el) => {
          groupRefs.current[0] = el;
        }}
      >
        <MicrocontrollerQfp
          scale={ITEMS_CONFIG[0].scale}
          brand="QUALCOMM"
          model="SNAPDRAGON EDGE"
          spec="OCTA-CORE 3.2GHz / 5G NPU"
        />
      </group>

      {/* 1: PCB Micro Module */}
      <group
        ref={(el) => {
          groupRefs.current[1] = el;
        }}
      >
        <PcbModule scale={ITEMS_CONFIG[1].scale} theme="green" />
      </group>

      {/* 2: AI Tensor Core Processor */}
      <group
        ref={(el) => {
          groupRefs.current[2] = el;
        }}
      >
        <AiTensorProcessor scale={ITEMS_CONFIG[2].scale} />
      </group>

      {/* 3: Robotic Gear Wheel */}
      <group
        ref={(el) => {
          groupRefs.current[3] = el;
        }}
      >
        <RoboticGearWheel scale={ITEMS_CONFIG[3].scale} color="#94a3b8" />
      </group>

      {/* 4: Electrolytic Power Capacitor */}
      <group
        ref={(el) => {
          groupRefs.current[4] = el;
        }}
      >
        <ElectrolyticCapacitor scale={ITEMS_CONFIG[4].scale} />
      </group>

      {/* 5: Axial Resistor */}
      <group
        ref={(el) => {
          groupRefs.current[5] = el;
        }}
      >
        <AxialResistor scale={ITEMS_CONFIG[5].scale} />
      </group>

      {/* 6: Robotic Actuator Motor */}
      <group
        ref={(el) => {
          groupRefs.current[6] = el;
        }}
      >
        <RoboticActuatorMotor scale={ITEMS_CONFIG[6].scale} />
      </group>

      {/* 7: Silicon Wafer Disc */}
      <group
        ref={(el) => {
          groupRefs.current[7] = el;
        }}
      >
        <SiliconWaferDisc scale={ITEMS_CONFIG[7].scale} />
      </group>

      {/* 8: Schematic Hologram Card */}
      <group
        ref={(el) => {
          groupRefs.current[8] = el;
        }}
      >
        <SchematicHologramCard scale={ITEMS_CONFIG[8].scale} />
      </group>
    </group>
  );
}
