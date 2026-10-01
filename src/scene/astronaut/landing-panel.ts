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
import { ASTRONAUT_HEIGHT, type AstronautInstance } from "./astronaut-rig.ts";
import { stageUnitAt, type FinaleClock } from "./journey-clock.ts";

// 3D billboard ledge under the astronaut's boots. It appears under him as he
// lands, keeps a fixed billboard scale at zoom-out, and sits flush on the
// contact card's top edge. Every face reuses the card's dark-glass palette
// (navy slate, cyan lip light, near-black occlusion) and skips tone mapping,
// so the ledge renders the same sRGB colors as the CSS card beneath it.

const THICKNESS = 0.07;
const DEPTH = 0.55;
/** Share of the panel depth in front of his boots, so the deck reads ahead of him. */
const AHEAD = 0.72;

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

function paintedTexture(width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) paint(ctx);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  // The top face is seen at grazing angles; the renderer clamps to its maximum.
  texture.anisotropy = 8;
  return texture;
}

/** Front lip: the card's top slate, a cyan light line on the upper edge, and the card's side vignette. */
function frontTexture(): CanvasTexture {
  return paintedTexture(1024, 64, (ctx) => {
    const face = ctx.createLinearGradient(0, 0, 0, 64);
    face.addColorStop(0, "#1d3a5a");
    face.addColorStop(0.6, "#17304d");
    face.addColorStop(1, "#142a43");
    ctx.fillStyle = face;
    ctx.fillRect(0, 0, 1024, 64);
    const glow = ctx.createLinearGradient(0, 0, 1024, 0);
    glow.addColorStop(0.2, "rgba(56, 189, 248, 0)");
    glow.addColorStop(0.5, "rgba(56, 189, 248, 0.14)");
    glow.addColorStop(0.8, "rgba(56, 189, 248, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1024, 64);
    const sides = ctx.createLinearGradient(0, 0, 1024, 0);
    sides.addColorStop(0, "rgba(3, 10, 23, 0.72)");
    sides.addColorStop(0.08, "rgba(3, 10, 23, 0)");
    sides.addColorStop(0.92, "rgba(3, 10, 23, 0)");
    sides.addColorStop(1, "rgba(3, 10, 23, 0.72)");
    ctx.fillStyle = sides;
    ctx.fillRect(0, 0, 1024, 64);
    ctx.fillStyle = "rgba(125, 211, 252, 0.7)";
    ctx.fillRect(0, 0, 1024, 3);
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.fillRect(0, 3, 1024, 2);
  });
}

/** Top deck plate: navy slate darkening toward the back, a faint cyan grid, and a lit front lip. */
function topTexture(): CanvasTexture {
  return paintedTexture(512, 256, (ctx) => {
    // Canvas y runs back (top rows) to front (bottom rows) on the +Y face.
    const plate = ctx.createLinearGradient(0, 0, 0, 256);
    plate.addColorStop(0, "#0b1829");
    plate.addColorStop(1, "#16304d");
    ctx.fillStyle = plate;
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = "rgba(125, 211, 252, 0.07)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= 512; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, 256);
      ctx.stroke();
    }
    for (let y = 0; y <= 256; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(512, y + 0.5);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(125, 211, 252, 0.55)";
    ctx.fillRect(0, 252, 512, 4);
  });
}

export type LandingPanel = {
  mesh: Mesh<BoxGeometry, MeshBasicMaterial[]>;
  edges: LineSegments<EdgesGeometry, LineBasicMaterial>;
};

/** 3D billboard ledge in the card's palette; unlit so it matches the DOM card exactly. */
export function createLandingPanel(): LandingPanel {
  const face = (color: string, map: CanvasTexture | null = null): MeshBasicMaterial =>
    new MeshBasicMaterial({ color, map, transparent: true, toneMapped: false });
  // BoxGeometry face order: +X (right), -X (left), +Y (top), -Y (bottom), +Z (front), -Z (back).
  // The settled ledge sits above the camera's eye line, so the underside shows
  // as a band below the lip: near-black navy, it reads as the ledge's shadow.
  const materials = [
    face("#08121f"),
    face("#0c1a2c"),
    face("#ffffff", topTexture()),
    face("#060d18"),
    face("#ffffff", frontTexture()),
    face("#050b15"),
  ];
  // Unit cube: `placeLandingPanel` sets mesh.scale to the exact card width,
  // thickness, and depth per axis.
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), materials);
  const edges = new LineSegments(
    new EdgesGeometry(mesh.geometry),
    new LineBasicMaterial({ color: "#7dd3fc", transparent: true, toneMapped: false }),
  );
  mesh.add(edges);
  mesh.visible = false;
  return { mesh, edges };
}

export function disposeLandingPanel(panel: LandingPanel): void {
  panel.mesh.geometry.dispose();
  for (const material of panel.mesh.material) {
    material.map?.dispose();
    material.dispose();
  }
  panel.edges.geometry.dispose();
  panel.edges.material.dispose();
}

/**
 * Places the panel for this frame. Before touchdown it rides under his current
 * boots (`soleY`, root-local rig units) at his current scale; `fall` carries it
 * onto the card-anchored placement.
 */
export function placeLandingPanel(
  panel: LandingPanel,
  anchor: LandingAnchor | null,
  hero: AstronautInstance,
  soleY: number,
  fall: number,
  shown: number,
  scratch: Vector3,
): void {
  const { mesh } = panel;
  mesh.visible = anchor !== null && shown > 0.001;
  if (!anchor || !mesh.visible) return;
  const k = hero.root.scale.x / anchor.scale;
  const lerp = (from: number, to: number): number => from + (to - from) * fall;
  const soleTop = hero.root.localToWorld(scratch.set(0, soleY, 0)).y;
  const size = lerp(k, 1);
  const thickness = anchor.thickness * size;
  const depth = anchor.depth * size;
  const top = lerp(soleTop, anchor.top);
  const x = lerp(hero.root.position.x + (anchor.panelX - anchor.x) * k, anchor.panelX);
  const front = lerp(hero.root.position.z + anchor.frontZ * k, anchor.frontZ);
  mesh.scale.set(anchor.width * size, thickness, depth);
  mesh.position.set(x, top - thickness / 2, front - depth / 2);
  for (const material of mesh.material) material.opacity = shown;
  panel.edges.material.opacity = shown * 0.28;
}
