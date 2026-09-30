import {
  BoxGeometry,
  CanvasTexture,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  SRGBColorSpace,
  type Camera,
  type Vector3,
} from "three";
import type { ContactPoseMode } from "../../components/ui/contact/banner-timeline.ts";
import { ASTRONAUT_HEIGHT, type AstronautInstance } from "./astronaut-rig.ts";
import { stageUnitAt, type FinaleClock } from "./journey-clock.ts";

// 3D Billboard / Hoarding Landing Deck under the astronaut's boots.
// Appears under him as he lands, maintains fixed billboard scale at zoom-out,
// and connects flush onto the contact card's top edge to form a continuous
// 3D billboard hoarding structure.

const THICKNESS = 0.16;
const DEPTH = 0.55;
/** Share of the panel depth in front of his boots, so the deck reads ahead of him. */
const AHEAD = 0.72;
/** Rig units from the ankle joint down to the boot sole. */
const SOLE_BELOW_ANKLE = 0.1;
/** Seated poses: hips above the panel top, and how far behind the front edge (rig units). */
const SEAT_HEIGHT = 0.2;
const SEAT_BACK = 0.22;
/** Lying down pose: torso height above platform deck. */
const LIE_HEIGHT = 0.08;
const LIE_BACK = 0.25;

export type LandingAnchor = {
  /** Astronaut x, panel top y, and scale once landed (world units). */
  x: number;
  top: number;
  scale: number;
  /** Panel box: centre x, size, and the z of its front face. */
  panelX: number;
  width: number;
  thickness: number;
  depth: number;
  frontZ: number;
};

/**
 * World placement of the panel and the astronaut on it, from the DOM-measured
 * card. The panel's front face spans the card width and its bottom edge
 * projects exactly onto the card's top edge.
 */
export function landingAnchor(
  finale: FinaleClock,
  camera: Camera,
  stageWidth: number,
  stageHeight: number,
): LandingAnchor | null {
  if (finale.bodyHeight <= 0 || finale.cardWidth <= 0) return null;
  const nearUnit = stageUnitAt(stageHeight, camera, 0);
  const scale = (finale.bodyHeight * nearUnit) / ASTRONAUT_HEIGHT;
  const body = ASTRONAUT_HEIGHT * scale;
  const depth = DEPTH * body;
  const frontZ = AHEAD * depth;
  const frontUnit = stageUnitAt(stageHeight, camera, frontZ);
  const thickness = THICKNESS * body;
  return {
    x: (finale.footX - stageWidth / 2) * nearUnit,
    top: -(finale.cardTop - stageHeight / 2) * frontUnit + thickness,
    scale,
    panelX: (finale.cardLeft + finale.cardWidth / 2 - stageWidth / 2) * frontUnit,
    width: finale.cardWidth * frontUnit,
    thickness,
    depth,
    frontZ,
  };
}

/** Root y/z resting the astronaut on the panel for all modes: standing, seated, lying, climbing, walking. */
export function restOnPanel(
  anchor: LandingAnchor,
  mode: ContactPoseMode,
  localSoleY: number,
  time = 0,
): { xOffset: number; y: number; z: number } {
  if (mode === "sit" || mode === "wait") {
    return { xOffset: 0, y: anchor.top + SEAT_HEIGHT * anchor.scale, z: anchor.frontZ - SEAT_BACK * anchor.scale };
  }
  if (mode === "lie") {
    return { xOffset: 0, y: anchor.top + LIE_HEIGHT * anchor.scale, z: anchor.frontZ - LIE_BACK * anchor.scale };
  }
  if (mode === "walkPlank") {
    // Walking across the plank catwalk back and forth
    const walkX = Math.sin(time * 0.8) * (anchor.width * 0.38);
    return { xOffset: walkX, y: anchor.top - localSoleY * anchor.scale, z: 0 };
  }
  if (mode === "dance") {
    // Moonwalk sideways shift
    const danceX = Math.sin(time * 1.5) * (anchor.width * 0.25);
    return { xOffset: danceX, y: anchor.top - localSoleY * anchor.scale, z: 0 };
  }
  if (mode === "jumpWave") {
    // Up and down jumping on the deck
    const jumpY = Math.abs(Math.sin(time * 5.0)) * 0.15 * anchor.scale;
    return { xOffset: 0, y: anchor.top - localSoleY * anchor.scale + jumpY, z: 0 };
  }
  if (mode === "wallClimb") {
    // Both hands straight holding billboard top edge with legs in front of the billboard
    const cornerX = anchor.width * 0.4;
    const sway = Math.sin(time * 2.2) * 0.02 * anchor.scale;
    return { xOffset: cornerX + sway, y: anchor.top - 1.18 * anchor.scale, z: anchor.frontZ + 0.14 * anchor.scale };
  }
  return { xOffset: 0, y: anchor.top - localSoleY * anchor.scale, z: 0 };
}

/** Lowest boot sole in root-local rig units for the pose currently on the skeleton. */
export function localSoleY(hero: AstronautInstance, scratch: Vector3): number {
  const left = hero.root.worldToLocal(hero.bones.footL.getWorldPosition(scratch)).y;
  const right = hero.root.worldToLocal(hero.bones.footR.getWorldPosition(scratch)).y;
  return Math.min(left, right) - SOLE_BELOW_ANKLE;
}

/** Billboard front face texture: exact dark card gradient + cyan glow + metallic edge rim. */
function billboardFrontTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    // Card exact void theme gradient: #090d16 -> #0d1728
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, "#0d1728");
    bg.addColorStop(0.5, "#0a1120");
    bg.addColorStop(1, "#090d16");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Top-center cyan glow aura matching card theme
    const glow = ctx.createRadialGradient(canvas.width / 2, 0, 2, canvas.width / 2, 0, canvas.width * 0.5);
    glow.addColorStop(0, "rgba(56, 189, 248, 0.4)");
    glow.addColorStop(0.4, "rgba(56, 189, 248, 0.15)");
    glow.addColorStop(1, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Top edge metallic cyan highlight rim
    ctx.fillStyle = "rgba(125, 211, 252, 0.85)";
    ctx.fillRect(0, 0, canvas.width, 3);

    // Bottom rim border connecting flush to lower card
    ctx.fillStyle = "rgba(56, 189, 248, 0.45)";
    ctx.fillRect(0, canvas.height - 2, canvas.width, 2);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Billboard top platform texture: industrial anti-slip deck grid. */
function billboardTopTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#1a2a3a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Industrial grid pattern on platform surface matching card theme
    ctx.strokeStyle = "rgba(56, 189, 248, 0.18)";
    ctx.lineWidth = 1.5;
    const step = 32;
    for (let x = 0; x <= canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Front lip glowing landing strip
    ctx.fillStyle = "rgba(56, 189, 248, 0.6)";
    ctx.fillRect(0, canvas.height - 6, canvas.width, 6);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export type LandingPanel = {
  mesh: Mesh<BoxGeometry, MeshBasicMaterial[]>;
  edges: LineSegments<EdgesGeometry, LineBasicMaterial>;
};

/** 3D billboard hoarding deck with industrial frame outline and card-matched shaders. */
export function createLandingPanel(): LandingPanel {
  // Side shadows for 3D depth effect
  const sideShadow = new MeshBasicMaterial({ color: "#050a13", transparent: true });
  const sideLight = new MeshBasicMaterial({ color: "#0a1428", transparent: true });
  const top = new MeshBasicMaterial({ map: billboardTopTexture(), transparent: true });
  const bottom = new MeshBasicMaterial({ color: "#04070d", transparent: true });
  const front = new MeshBasicMaterial({ map: billboardFrontTexture(), transparent: true });
  // BoxGeometry face order: +X (right), -X (left), +Y (top), -Y (bottom), +Z (front), -Z (back).
  // Right shadow, left light (shadows on both sides for 3D effect), top, bottom, front, back.
  const mesh = new Mesh(new BoxGeometry(1.35, 1.35, 1.35), [sideShadow, sideLight, top, bottom, front, sideShadow]);
  const edges = new LineSegments(
    new EdgesGeometry(mesh.geometry),
    new LineBasicMaterial({ color: "#38bdf8", transparent: true }),
  );
  mesh.add(edges);
  mesh.visible = false;
  return { mesh, edges };
}

export function disposeLandingPanel(panel: LandingPanel): void {
  panel.mesh.geometry.dispose();
  for (const material of new Set(panel.mesh.material)) {
    material.map?.dispose();
    material.dispose();
  }
  panel.edges.geometry.dispose();
  panel.edges.material.dispose();
}

/**
 * Places the panel for this frame. Before touchdown it rides under his current
 * boots at his current scale; `fall` carries it onto the card-anchored placement.
 */
export function placeLandingPanel(
  panel: LandingPanel,
  anchor: LandingAnchor | null,
  hero: AstronautInstance,
  fall: number,
  shown: number,
  scratch: Vector3,
): void {
  const { mesh } = panel;
  mesh.visible = anchor !== null && shown > 0.001;
  if (!anchor || !mesh.visible) return;
  const k = hero.root.scale.x / anchor.scale;
  const lerp = (from: number, to: number): number => from + (to - from) * fall;
  const soleTop = hero.root.localToWorld(scratch.set(0, localSoleY(hero, scratch), 0)).y;
  const size = lerp(k, 1);
  const thickness = anchor.thickness * size;
  const depth = anchor.depth * size;
  const top = lerp(soleTop, anchor.top);
  const x = lerp(hero.root.position.x + (anchor.panelX - anchor.x) * k, anchor.panelX);
  const front = lerp(hero.root.position.z + anchor.frontZ * k, anchor.frontZ);
  mesh.scale.set(anchor.width * size, thickness, depth);
  mesh.position.set(x, top - thickness / 2, front - depth / 2);
  for (const material of mesh.material) material.opacity = shown;
  panel.edges.material.opacity = shown * 0.75;
}
