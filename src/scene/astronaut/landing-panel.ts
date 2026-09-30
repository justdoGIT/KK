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

// A flat landing panel under the astronaut's boots. It appears beneath him as
// he lands, zooms out with him, and ends on the contact card's top edge so the
// card reads as attached beneath it. Proportions are in astronaut heights.

const THICKNESS = 0.1;
const DEPTH = 0.45;
/** Share of the panel depth in front of his boots, so the pad reads ahead of him. */
const AHEAD = 0.7;
/** Rig units from the ankle joint down to the boot sole. */
const SOLE_BELOW_ANKLE = 0.1;
/** Seated poses: hips above the panel top, and how far behind the front edge (rig units). */
const SEAT_HEIGHT = 0.2;
const SEAT_BACK = 0.2;

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

/** Root y/z resting the astronaut on the panel: boots on its top, or seated on its front edge. */
export function restOnPanel(
  anchor: LandingAnchor,
  mode: ContactPoseMode,
  localSoleY: number,
): { y: number; z: number } {
  if (mode === "sit" || mode === "wait") {
    return { y: anchor.top + SEAT_HEIGHT * anchor.scale, z: anchor.frontZ - SEAT_BACK * anchor.scale };
  }
  return { y: anchor.top - localSoleY * anchor.scale, z: 0 };
}

/** Lowest boot sole in root-local rig units for the pose currently on the skeleton. */
export function localSoleY(hero: AstronautInstance, scratch: Vector3): number {
  const left = hero.root.worldToLocal(hero.bones.footL.getWorldPosition(scratch)).y;
  const right = hero.root.worldToLocal(hero.bones.footR.getWorldPosition(scratch)).y;
  return Math.min(left, right) - SOLE_BELOW_ANKLE;
}

function faceTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    // Same palette as the contact card: navy band, cyan wash, bright lip.
    const band = ctx.createLinearGradient(0, 0, canvas.width, 0);
    band.addColorStop(0, "#173052");
    band.addColorStop(0.48, "#245078");
    band.addColorStop(1, "#142440");
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const wash = ctx.createLinearGradient(0, 0, 0, canvas.height);
    wash.addColorStop(0, "rgba(147, 164, 255, 0.5)");
    wash.addColorStop(1, "rgba(56, 189, 248, 0.16)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255, 255, 255, 0.42)";
    ctx.fillRect(0, 0, canvas.width, 2);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export type LandingPanel = {
  mesh: Mesh<BoxGeometry, MeshBasicMaterial[]>;
  edges: LineSegments<EdgesGeometry, LineBasicMaterial>;
};

/** Unit box scaled per frame; unlit so it matches the flat CSS card below it. */
export function createLandingPanel(): LandingPanel {
  const side = new MeshBasicMaterial({ color: "#142440", transparent: true });
  const top = new MeshBasicMaterial({ color: "#3a6aa6", transparent: true });
  const bottom = new MeshBasicMaterial({ color: "#0b1426", transparent: true });
  const front = new MeshBasicMaterial({ map: faceTexture(), transparent: true });
  // BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z.
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), [side, side, top, bottom, front, side]);
  const edges = new LineSegments(
    new EdgesGeometry(mesh.geometry),
    new LineBasicMaterial({ color: "#7dd3fc", transparent: true }),
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
  panel.edges.material.opacity = shown * 0.65;
}
