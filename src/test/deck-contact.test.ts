import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { Vector3, type SkinnedMesh } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import type { ContactPoseMode } from "../components/ui/contact/banner-timeline.ts";
import { applyPose, createPoseBuffer } from "../scene/astronaut/astronaut-poses.ts";
import { BONES, buildAstronautRig, instantiateAstronaut, type AstronautRigData } from "../scene/astronaut/astronaut-rig.ts";
import { sampleContactPose } from "../scene/astronaut/contact-poses.ts";
import { clearDeck, createPosedHull, placeHull, updatePosedHull } from "../scene/astronaut/deck-contact.ts";
import { contactRoot, createRootPose } from "../scene/astronaut/hero-motion.ts";
import type { LandingAnchor } from "../scene/astronaut/landing-panel.ts";

/** The suit GLB minus its images: jsdom cannot decode them, and contact needs geometry only. */
function withoutTextures(bytes: Uint8Array): ArrayBuffer {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const jsonLength = view.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + jsonLength)));
  delete json.images;
  delete json.textures;
  delete json.samplers;
  for (const material of json.materials ?? []) {
    delete material.pbrMetallicRoughness?.baseColorTexture;
    delete material.pbrMetallicRoughness?.metallicRoughnessTexture;
    delete material.normalTexture;
    delete material.occlusionTexture;
    delete material.emissiveTexture;
  }
  json.extensionsUsed = json.extensionsUsed?.filter((name: string) => name !== "EXT_texture_webp");
  const text = new TextEncoder().encode(JSON.stringify(json));
  const chunk = new Uint8Array(Math.ceil(text.length / 4) * 4).fill(0x20);
  chunk.set(text);
  const binary = bytes.subarray(20 + jsonLength);
  const out = new Uint8Array(20 + chunk.length + binary.length);
  const outView = new DataView(out.buffer);
  out.set(bytes.subarray(0, 12));
  outView.setUint32(8, out.length, true);
  outView.setUint32(12, chunk.length, true);
  outView.setUint32(16, 0x4e4f534a, true);
  out.set(chunk, 20);
  out.set(binary, 20 + chunk.length);
  return out.buffer;
}

let rig: AstronautRigData;
beforeAll(async () => {
  const bytes = new Uint8Array(await readFile(resolve("public/models/characters/nasa-astronaut.glb")));
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  rig = buildAstronautRig((await loader.parseAsync(withoutTextures(bytes), "")).scene);
});

// The deck as measured in the live finale at 1280x800 once the card settles.
const DECK: LandingAnchor = {
  x: -0.62,
  top: 1.205,
  scale: 0.306,
  panelX: 0,
  width: 3.974,
  thickness: 0.038,
  depth: 0.303,
  frontZ: 0.218,
};
const BACK = DECK.frontZ - DECK.depth;
/** Penetration below this (1% of body scale, well under a pixel) is invisible. */
const TOLERANCE = DECK.scale * 0.01;
const TIMES = [0, 0.9, 2.2, 3.7];
const MODES: ContactPoseMode[] = ["stand", "sit", "wait", "lie", "dance", "moonwalk", "walkPlank", "jumpWave", "wallClimb"];

/** Full pipeline (pose → hull → contact root → clearance), then every suit vertex in world space. */
function placedSuit(mode: ContactPoseMode, time: number): Vector3[] {
  const hero = instantiateAstronaut(rig);
  const pose = createPoseBuffer();
  sampleContactPose(mode, time, 1, pose, 0.3, -0.2);
  applyPose(hero, pose);
  hero.root.updateWorldMatrix(true, true);
  const hull = updatePosedHull(hero, rig.hull, createPosedHull(rig.hull));
  const root = contactRoot(DECK, mode, hull, 1, time, createRootPose());
  clearDeck(DECK, placeHull(hull, root, new Float32Array(hull.points.length)), root);
  hero.root.position.set(root.x, root.y, root.z);
  hero.root.rotation.set(root.rx, root.ry, root.rz);
  hero.root.scale.setScalar(root.scale);
  hero.root.updateMatrixWorld(true);
  const vertices: Vector3[] = [];
  for (const child of hero.root.children) {
    const mesh = child as SkinnedMesh;
    if (!mesh.isSkinnedMesh) continue;
    const count = mesh.geometry.getAttribute("position").count;
    for (let i = 0; i < count; i += 1) vertices.push(mesh.getVertexPosition(i, new Vector3()).applyMatrix4(mesh.matrixWorld));
  }
  return vertices;
}

const overDeck = (v: Vector3): boolean =>
  v.x > DECK.panelX - DECK.width / 2 && v.x < DECK.panelX + DECK.width / 2 && v.z > BACK && v.z < DECK.frontZ;

describe("astronaut contact with the landing deck", () => {
  it("keeps near-lip transition points out of the slab", () => {
    const root = { x: 0, y: 0, z: 0, scale: DECK.scale, rx: 0, ry: 0, rz: 0 };
    const world = new Float32Array([
      DECK.panelX,
      DECK.top - 0.02,
      DECK.frontZ - 0.001,
    ]);

    clearDeck(DECK, world, root);

    const stillInside = world[2] > BACK && world[2] < DECK.frontZ && world[1] < DECK.top;
    expect(stillInside).toBe(false);
  });

  it.each(MODES)("keeps the %s suit out of and above the deck slab", (mode) => {
    for (const time of TIMES) {
      const sunk = placedSuit(mode, time).filter((v) => overDeck(v) && v.y < DECK.top - TOLERANCE);
      expect(sunk.length, `${mode} at ${time}s`).toBe(0);
    }
  });

  it("keeps the landed root finite while any mode blends into another", () => {
    // A stride blending into the seat once left nothing behind the shins to
    // sit on, so the root went non-finite and the astronaut and panel vanished.
    const hero = instantiateAstronaut(rig);
    const from = createPoseBuffer();
    const to = createPoseBuffer();
    const pose = createPoseBuffer();
    const hull = createPosedHull(rig.hull);
    const world = new Float32Array(hull.points.length);
    const failures: string[] = [];
    for (const a of ["landing", ...MODES] as const) {
      for (const b of MODES) {
        for (let time = 0; time < 8; time += 0.35) {
          sampleContactPose(a, time, 1, from);
          sampleContactPose(b, time, 1, to);
          for (const k of [0, 0.1, 0.5, 1]) {
            for (const bone of BONES) {
              for (let i = 0; i < 3; i += 1) pose[bone][i] = from[bone][i] + (to[bone][i] - from[bone][i]) * k;
            }
            applyPose(hero, pose);
            hero.root.updateWorldMatrix(true, true);
            updatePosedHull(hero, rig.hull, hull);
            const root = contactRoot(DECK, b, hull, 1, time, createRootPose());
            clearDeck(DECK, placeHull(hull, root, world), root);
            if (!Number.isFinite(root.x + root.y + root.z)) failures.push(`${a} -> ${b} at ${time.toFixed(2)}s, blend ${k}`);
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it.each(["sit", "wait"] as const)("seats the %s pose on the lip with the shins hanging in front of the face", (mode) => {
    const suit = placedSuit(mode, 0);
    const hanging = suit.filter((v) => v.y < DECK.top - DECK.thickness);
    expect(hanging.length).toBeGreaterThan(500);
    expect(Math.min(...hanging.map((v) => v.z))).toBeGreaterThan(DECK.frontZ);
    const seat = Math.min(...suit.filter(overDeck).map((v) => v.y));
    expect(seat - DECK.top).toBeLessThan(DECK.scale * 0.03);
  });

  it("reclines along the plate inside the deck depth", () => {
    const suit = placedSuit("lie", 0);
    const lowest = Math.min(...suit.map((v) => v.y));
    expect(lowest - DECK.top).toBeGreaterThan(-TOLERANCE);
    expect(lowest - DECK.top).toBeLessThan(DECK.scale * 0.03);
    const height = Math.max(...suit.map((v) => v.y)) - lowest;
    const length = Math.max(...suit.map((v) => v.x)) - Math.min(...suit.map((v) => v.x));
    expect(length).toBeGreaterThan(height * 1.5);
    expect(Math.min(...suit.map((v) => v.z))).toBeGreaterThan(BACK - TOLERANCE);
    expect(Math.max(...suit.map((v) => v.z))).toBeLessThan(DECK.frontZ + TOLERANCE);
  });

  it("hangs the wall climb in front of the face near the deck's right end, gloves at the lip", () => {
    for (const time of TIMES) {
      const suit = placedSuit("wallClimb", time);
      expect(Math.min(...suit.map((v) => v.z))).toBeGreaterThan(DECK.frontZ);
      expect(Math.min(...suit.map((v) => v.x))).toBeGreaterThan(DECK.panelX + DECK.width * 0.3);
      expect(Math.max(...suit.map((v) => v.x))).toBeLessThan(DECK.panelX + DECK.width / 2);
      expect(Math.max(...suit.map((v) => v.y))).toBeGreaterThan(DECK.top);
    }
  });
});
