import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace } from "three";
import type { LandingAnchor } from "./landing-panel.ts";

// Soft shadows that ground the astronaut on the ledge: a contact blob on the
// deck plate under whatever rests on it, and a drop shadow on the card face
// behind whatever hangs in front of it (shins over the lip, the wall hang).
// Both are fitted every frame to the placed suit hull.

/** Suit points this close above the plate darken it (rig units). */
const CONTACT_REACH = 0.3;

type ShadowMesh = Mesh<PlaneGeometry, MeshBasicMaterial>;
export type DeckShadows = { contact: ShadowMesh; card: ShadowMesh };

function blobTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const blob = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    blob.addColorStop(0, "rgba(1, 4, 10, 0.92)");
    blob.addColorStop(0.5, "rgba(1, 4, 10, 0.5)");
    blob.addColorStop(1, "rgba(1, 4, 10, 0)");
    ctx.fillStyle = blob;
    ctx.fillRect(0, 0, 128, 128);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function createDeckShadows(): DeckShadows {
  const map = blobTexture();
  const shadow = (): ShadowMesh => {
    const mesh = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false }),
    );
    mesh.visible = false;
    return mesh;
  };
  const contact = shadow();
  contact.rotation.x = -Math.PI / 2;
  return { contact, card: shadow() };
}

export function disposeDeckShadows(shadows: DeckShadows): void {
  shadows.contact.material.map?.dispose();
  for (const mesh of [shadows.contact, shadows.card]) {
    mesh.geometry.dispose();
    mesh.material.dispose();
  }
}

/**
 * Fits both shadows to the placed hull (`world`, stride 3). Points resting
 * within reach above the plate size the contact blob, which fades as the
 * body rises; points hanging in front of the face below the lip size a drop
 * shadow cast down-right onto the card (the key light sits up-left).
 */
export function placeDeckShadows(
  shadows: DeckShadows,
  anchor: LandingAnchor | null,
  world: Float32Array,
  scale: number,
  shown: number,
): void {
  const { contact, card } = shadows;
  contact.visible = false;
  card.visible = false;
  if (!anchor || shown <= 0.001) return;
  const back = anchor.frontZ - anchor.depth;
  const reach = CONTACT_REACH * scale;
  const rest = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity, low: Infinity };
  const hang = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
  for (let i = 0; i < world.length; i += 3) {
    const x = world[i];
    const y = world[i + 1];
    const z = world[i + 2];
    if (z >= back && z <= anchor.frontZ && y >= anchor.top && y - anchor.top < reach) {
      rest.x0 = Math.min(rest.x0, x);
      rest.x1 = Math.max(rest.x1, x);
      rest.z0 = Math.min(rest.z0, z);
      rest.z1 = Math.max(rest.z1, z);
      rest.low = Math.min(rest.low, y - anchor.top);
    } else if (z > anchor.frontZ && y < anchor.top) {
      hang.x0 = Math.min(hang.x0, x);
      hang.x1 = Math.max(hang.x1, x);
      hang.y0 = Math.min(hang.y0, y);
      hang.y1 = Math.max(hang.y1, y);
    }
  }
  if (rest.x1 > rest.x0) {
    const pad = 0.1 * scale;
    contact.visible = true;
    contact.position.set((rest.x0 + rest.x1) / 2, anchor.top + 0.002 * scale, (rest.z0 + rest.z1) / 2);
    contact.scale.set(rest.x1 - rest.x0 + pad * 2, Math.min(anchor.depth, rest.z1 - rest.z0 + pad * 2), 1);
    contact.material.opacity = shown * 0.6 * (1 - Math.min(1, rest.low / reach));
  }
  if (hang.x1 > hang.x0) {
    const pad = 0.08 * scale;
    card.visible = true;
    card.position.set((hang.x0 + hang.x1) / 2 + 0.05 * scale, (hang.y0 + hang.y1) / 2 - 0.05 * scale, anchor.frontZ + 0.002 * scale);
    card.scale.set(hang.x1 - hang.x0 + pad * 2, hang.y1 - hang.y0 + pad * 2, 1);
    card.material.opacity = shown * 0.42;
  }
}
