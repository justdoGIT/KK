import { Euler, Matrix4, Vector3 } from "three";
import type { ContactPoseMode } from "../../components/ui/contact/banner-timeline.ts";
import { BONES, type AstronautHull, type AstronautInstance, type BoneName } from "./astronaut-rig.ts";
import type { LandingAnchor } from "./landing-panel.ts";

// Contact between the posed suit and the landing deck. The rig's support hull
// (each bone's outermost suit vertices) is re-posed every frame, so standing,
// seated, reclining, and hanging modes rest on, overhang, or hang in front of
// the slab from the suit's real surface rather than tuned offsets.

/** The support hull posed by the current skeleton, in root-local rig units. */
export type PosedHull = { bones: Uint8Array; points: Float32Array };

/** Root transform for a contact mode; `x` is an offset from `anchor.x`. */
export type DeckRest = { x: number; y: number; z: number; rx: number; ry: number; rz: number };

/** Root rotation and scale used by `clearDeck` (the shape of `RootPose`). */
type PlacedRoot = { x: number; y: number; z: number; scale: number; rx: number; ry: number; rz: number };

const boneIndex = (name: BoneName): number => BONES.indexOf(name);
const LOWER_LEGS = [boneIndex("shinL"), boneIndex("footL"), boneIndex("shinR"), boneIndex("footR")];
const HANDS = [boneIndex("handL"), boneIndex("handR")];

/** Gap kept between the suit and a deck face it rests on or hangs in front of (rig units). */
const CLEARANCE = 0.012;
/** Seated spot, as a share of the deck width left of the standing spot (clear of the card copy). */
const SEAT_X = -0.2;
/** The wall hang grips the lip this share of the deck width inside its right end. */
const HANG_INSET = 0.07;
/** Gloves rise this far above the lip while gripping it (rig units). */
const GRIP = 0.035;
/** Reclining on the left side, head toward +x, facing the camera. */
export const RECLINE_ROLL = -1.2;
/** Depth behind the front face over which transitional depenetration ramps in (rig units). */
const ENTRY_RAMP = 0.08;

const toRoot = new Matrix4();
const boneToRoot = BONES.map(() => new Matrix4());
const rotation = new Matrix4();
const euler = new Euler();
const point = new Vector3();
const second = new Vector3();

export function createPosedHull(hull: AstronautHull): PosedHull {
  return { bones: hull.bones, points: new Float32Array(hull.bones.length * 3) };
}

/** Re-poses the hull from the skeleton's current world matrices, skinned like the GPU (root-local result). */
export function updatePosedHull(hero: AstronautInstance, hull: AstronautHull, out: PosedHull): PosedHull {
  toRoot.copy(hero.root.matrixWorld).invert();
  BONES.forEach((name, bone) => boneToRoot[bone].multiplyMatrices(toRoot, hero.bones[name].matrixWorld));
  for (let i = 0; i < hull.bones.length; i += 1) {
    point.fromArray(hull.local, i * 6).applyMatrix4(boneToRoot[hull.pairs[i * 2]]);
    second.fromArray(hull.local, i * 6 + 3).applyMatrix4(boneToRoot[hull.pairs[i * 2 + 1]]);
    point.multiplyScalar(hull.weights[i * 2]).addScaledVector(second, hull.weights[i * 2 + 1]).toArray(out.points, i * 3);
  }
  return out;
}

/** Lowest suit point relative to the root (rig units): the boot soles when standing. */
export function hullFloor(hull: PosedHull): number {
  let floor = Infinity;
  for (let i = 1; i < hull.points.length; i += 3) floor = Math.min(floor, hull.points[i]);
  return floor;
}

function oriented(hull: PosedHull, i: number): Vector3 {
  return point.fromArray(hull.points, i * 3).applyMatrix4(rotation);
}

/** Smooth turnaround at the ends of a back-and-forth glide: ±1 facing the travel axis, 0 facing the camera. */
function facing(velocity: number): number {
  const k = Math.min(1, Math.abs(velocity) / 0.35);
  return Math.sign(velocity) * k * k * (3 - 2 * k);
}

function orient(mode: ContactPoseMode, time: number, out: DeckRest): void {
  out.rx = 0;
  out.ry = 0;
  out.rz = 0;
  if (mode === "walkPlank") out.ry = (Math.PI / 2) * facing(Math.cos(time * 0.8));
  // A moonwalk glides backwards: the body faces against the slide.
  else if (mode === "moonwalk") out.ry = (-Math.PI / 2) * facing(Math.cos(time * 1.5));
  else if (mode === "dance") out.ry = Math.sin(time * 3.1) * 0.18;
  // Gripping the lip: face the billboard, back to the viewer.
  else if (mode === "wallClimb") out.ry = Math.PI;
  else if (mode === "lie") out.rz = RECLINE_ROLL;
}

/**
 * Root placement resting the posed suit on the deck for `mode`. Standing modes
 * put the lowest sole on the top face; seated modes overhang the front lip so
 * the shins hang clear of the front face; the recline lies inside the deck's
 * depth; the wall hang keeps the whole suit in front of the face, gloves at
 * the lip, near the deck's right end so the card copy stays visible.
 */
export function restOnDeck(
  anchor: LandingAnchor,
  mode: ContactPoseMode,
  hull: PosedHull,
  time: number,
  out: DeckRest,
): DeckRest {
  const s = anchor.scale;
  const count = hull.bones.length;
  orient(mode, time, out);
  rotation.makeRotationFromEuler(euler.set(out.rx, out.ry, out.rz));
  out.x = 0;
  out.z = 0;

  if (mode === "sit" || mode === "wait") {
    let legBack = Infinity;
    for (let i = 0; i < count; i += 1) {
      if (LOWER_LEGS.includes(hull.bones[i])) legBack = Math.min(legBack, oriented(hull, i).z);
    }
    out.x = anchor.width * SEAT_X;
    out.z = anchor.frontZ + CLEARANCE * s - legBack * s;
    const overDeck = (anchor.frontZ - out.z) / s;
    let seat = Infinity;
    for (let i = 0; i < count; i += 1) {
      const q = oriented(hull, i);
      if (q.z <= overDeck) seat = Math.min(seat, q.y);
    }
    out.y = anchor.top + CLEARANCE * s - seat * s;
    return out;
  }

  let minY = Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let gripTop = -Infinity;
  for (let i = 0; i < count; i += 1) {
    const q = oriented(hull, i);
    minY = Math.min(minY, q.y);
    minZ = Math.min(minZ, q.z);
    maxZ = Math.max(maxZ, q.z);
    if (HANDS.includes(hull.bones[i])) gripTop = Math.max(gripTop, q.y);
  }

  if (mode === "lie") {
    out.z = anchor.frontZ - anchor.depth / 2 - ((minZ + maxZ) / 2) * s;
    out.y = anchor.top + CLEARANCE * s - minY * s;
  } else if (mode === "wallClimb") {
    out.x = anchor.panelX + anchor.width * (0.5 - HANG_INSET) - anchor.x;
    out.z = anchor.frontZ + CLEARANCE * s - minZ * s;
    out.y = anchor.top + GRIP * s - gripTop * s + Math.sin(time * 1.1) * 0.025 * s;
  } else {
    out.y = anchor.top - minY * s;
    if (mode === "walkPlank") out.x = Math.sin(time * 0.8) * anchor.width * 0.38;
    else if (mode === "moonwalk") out.x = Math.sin(time * 1.5) * anchor.width * 0.25;
    else if (mode === "dance") {
      out.x = Math.sin(time * 3.1) * anchor.width * 0.06;
      out.y += Math.abs(Math.sin(time * 6.2)) * 0.035 * s;
    } else if (mode === "jumpWave") out.y += Math.abs(Math.sin(time * 5)) * 0.15 * s;
  }
  return out;
}

/** World positions of the posed hull for a placed root (stride 3), for clearance and shadows. */
export function placeHull(hull: PosedHull, root: PlacedRoot, out: Float32Array): Float32Array {
  rotation.makeRotationFromEuler(euler.set(root.rx, root.ry, root.rz));
  for (let i = 0; i < hull.bones.length; i += 1) {
    const q = oriented(hull, i);
    out[i * 3] = root.x + q.x * root.scale;
    out[i * 3 + 1] = root.y + q.y * root.scale;
    out[i * 3 + 2] = root.z + q.z * root.scale;
  }
  return out;
}

/**
 * Lifts a landed root (and its placed hull) so no suit point sits inside or
 * beneath the slab's footprint. Mode changes blend pose and root over a few
 * frames, and a blend between e.g. hanging and reclining would otherwise sweep
 * the legs through the deck. The lift ramps in over `ENTRY_RAMP` behind the
 * front face, so a point crossing the face never makes the body jump.
 */
export function clearDeck(anchor: LandingAnchor, world: Float32Array, root: PlacedRoot): void {
  const back = anchor.frontZ - anchor.depth;
  const left = anchor.panelX - anchor.width / 2;
  const right = anchor.panelX + anchor.width / 2;
  const ramp = ENTRY_RAMP * root.scale;
  let lift = 0;
  for (let i = 0; i < world.length; i += 3) {
    const z = world[i + 2];
    if (world[i] < left || world[i] > right || z < back || z > anchor.frontZ) continue;
    lift = Math.max(lift, (anchor.top - world[i + 1]) * Math.min(1, (anchor.frontZ - z) / ramp));
  }
  if (lift <= 0) return;
  root.y += lift;
  for (let i = 1; i < world.length; i += 3) world[i] += lift;
}
