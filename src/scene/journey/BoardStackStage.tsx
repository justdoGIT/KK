import { useEffect, useMemo, useRef, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PcbModule } from "../components/PcbModule.tsx";
import { MicrocontrollerQfp } from "../components/MicrocontrollerQfp.tsx";
import { boardLifecycle, softwareLayers } from "../../content/board-lifecycle.ts";

const LAYER_H = 0.36;
const LAYER_GAP = 0.08;
const STACK_BASE = -0.35;

function layerTexture(label: string, step: number, color: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 144;
  const ctx = canvas.getContext("2d")!;
  const bg = ctx.createLinearGradient(0, 0, 1024, 0);
  bg.addColorStop(0, "#0b1a30");
  bg.addColorStop(1, "#10284a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 144);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 14, 144);
  ctx.font = "600 34px monospace";
  ctx.fillStyle = color;
  ctx.fillText(`0${step}`, 44, 88);
  ctx.font = "700 52px sans-serif";
  ctx.fillStyle = "#f1f5f9";
  ctx.fillText(label, 130, 92);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * The software stack built on the board: `built` layers (1–5) rest on the
 * hardware, the newest one drops into place, and earlier layers dim.
 */
export function BoardStackStage({ built }: { built: number }): JSX.Element {
  const layers = useRef<(THREE.Group | null)[]>([]);
  const textures = useMemo(
    () => softwareLayers.map((label, i) => layerTexture(label, i + 2, boardLifecycle[i + 1].color)),
    [],
  );
  useEffect(() => () => textures.forEach((texture) => texture.dispose()), [textures]);

  useFrame((_, delta) => {
    layers.current.forEach((layer, i) => {
      if (!layer) return;
      const rest = STACK_BASE + i * (LAYER_H + LAYER_GAP);
      const target = i < built ? rest : rest + 2.6;
      layer.position.y += (target - layer.position.y) * Math.min(1, delta * 6);
      layer.visible = layer.position.y < rest + 2.4;
    });
  });

  return (
    <group position={[0, -0.55, 0]} rotation={[0.28, -0.42, 0]}>
      {/* Hardware foundation: board, SoC, and power already proven. */}
      <group position={[0, -0.75, 0]} rotation={[-Math.PI / 2.6, 0, 0]} scale={0.62}>
        <PcbModule theme="dark" />
        <MicrocontrollerQfp position={[0, 0, 0.1]} scale={0.55} brand="SoC" model="HARDWARE" spec="PCB · PMIC · DDR" />
      </group>
      {softwareLayers.map((label, i) => (
        <group
          key={label}
          ref={(el) => {
            layers.current[i] = el;
          }}
          position={[0, STACK_BASE + i * (LAYER_H + LAYER_GAP) + 2.6, 0]}
        >
          <mesh>
            <boxGeometry args={[2.3, LAYER_H, 0.9]} />
            <meshStandardMaterial attach="material-0" color="#0c1a2e" />
            <meshStandardMaterial attach="material-1" color="#0c1a2e" />
            <meshStandardMaterial attach="material-2" color={boardLifecycle[i + 1].color} emissive={boardLifecycle[i + 1].color} emissiveIntensity={i === built - 1 ? 0.6 : 0.12} />
            <meshStandardMaterial attach="material-3" color="#0c1a2e" />
            <meshStandardMaterial attach="material-4" map={textures[i]} emissive="#ffffff" emissiveMap={textures[i]} emissiveIntensity={i === built - 1 ? 0.55 : 0.2} />
            <meshStandardMaterial attach="material-5" color="#0c1a2e" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
