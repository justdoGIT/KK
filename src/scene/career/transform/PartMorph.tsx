import { useLayoutEffect, useRef, type JSX } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Points,
  PointsMaterial,
  Quaternion,
  TorusGeometry,
  Vector3,
  type Group,
  type Material,
  type Object3D,
} from "three";
import type { CareerClockRef } from "../career-clock.ts";
import { TRANSFORM_END, clamp01 } from "../career-timeline.ts";
import { bakeModel, disposeBaked, type BakedModel } from "./bake.ts";
import {
  createMorphPlan,
  easeInOutCubic,
  easeOutBack,
  localProgress,
  mulberry,
  partRotation,
  type MorphPlan,
} from "./morph-plan.ts";

const SPARKS = 180;
const SPARK_LIFE = 0.09;
const CYAN = new Color("#38bdf8");

type Rig = {
  from: BakedModel;
  to: BakedModel;
  plan: MorphPlan;
  source: Mesh[];
  target: Mesh[];
  sparks: Points;
  sparkOwner: Int16Array;
  sparkVel: Float32Array;
  ring: Mesh;
  linkage: LineSegments;
  center: Vector3;
  height: number;
  q: Quaternion;
};
export type MorphFactory = () => Object3D;

type PartMorphProps = {
  /** Returns the posed source model to bake (called once per factory identity). */
  source: MorphFactory;
  target: MorphFactory;
  clock: CareerClockRef;
  /** Stage-local window [start, end] mapped to morph progress 0..1. */
  range?: readonly [number, number];
  seed: number;
};

function setGlow(material: Material, amount: number): void {
  const standard = material as MeshStandardMaterial;
  if (!standard.emissive) return;
  standard.emissive.copy(CYAN);
  standard.emissiveIntensity = amount;
}

function smoothFold(value: number): number {
  return value * value * (3 - 2 * value);
}

function buildRig(group: Group, from: BakedModel, to: BakedModel, seed: number): Rig {
  const plan = createMorphPlan(from, to, seed);
  const toMesh = (part: BakedModel["parts"][number]) => {
    const mesh = new Mesh(part.geometry, part.material);
    mesh.castShadow = true;
    group.add(mesh);
    return mesh;
  };
  const source = from.parts.map(toMesh);
  const target = to.parts.map(toMesh);
  const rand = mulberry(seed * 7 + 3);
  const sparkOwner = new Int16Array(SPARKS);
  const sparkVel = new Float32Array(SPARKS * 3);
  for (let i = 0; i < SPARKS; i += 1) {
    sparkOwner[i] = Math.floor(rand() * to.parts.length);
    sparkVel.set([(rand() - 0.5) * 2, rand() * 1.6 + 0.4, (rand() - 0.5) * 2], i * 3);
  }
  const sparkGeometry = new BufferGeometry();
  sparkGeometry.setAttribute("position", new Float32BufferAttribute(new Float32Array(SPARKS * 3), 3));
  const sparks = new Points(
    sparkGeometry,
    new PointsMaterial({ color: "#bae6fd", size: 0.035, transparent: true, blending: AdditiveBlending, depthWrite: false }),
  );
  sparks.frustumCulled = false;
  const center = to.bounds.getCenter(new Vector3());
  const radius = Math.max(to.bounds.getSize(new Vector3()).x, to.bounds.getSize(new Vector3()).z) * 0.62 + 0.05;
  const ring = new Mesh(
    new TorusGeometry(radius, 0.008, 8, 96),
    new MeshBasicMaterial({ color: "#38bdf8", transparent: true, blending: AdditiveBlending, depthWrite: false }),
  );
  ring.rotation.x = Math.PI / 2;
  const linkageGeometry = new BufferGeometry();
  linkageGeometry.setAttribute("position", new Float32BufferAttribute(new Float32Array(to.parts.length * 6), 3));
  const linkage = new LineSegments(
    linkageGeometry,
    new LineBasicMaterial({ color: "#93a4ff", transparent: true, opacity: 0, blending: AdditiveBlending }),
  );
  linkage.frustumCulled = false;
  const height = Math.max(to.bounds.max.y, from.bounds.max.y) - Math.min(to.bounds.min.y, from.bounds.min.y);
  group.add(sparks, ring, linkage);
  return { from, to, plan, source, target, sparks, sparkOwner, sparkVel, ring, linkage, center, height, q: new Quaternion() };
}

/**
 * Cinematic, fully reversible clean-room mechanical rebuild. Openly licensed
 * source models are split into hard panels: shells fold into a compact core,
 * actuator lines extend, target panels hinge out, and every lock emits a flash.
 * The visual grammar references transformation cinema without copying any
 * proprietary Transformer geometry, characters, or animation.
 */
export function PartMorph({ source, target, clock, range = [0, TRANSFORM_END], seed }: PartMorphProps): JSX.Element {
  const group = useRef<Group>(null);
  const rig = useRef<Rig | null>(null);

  useLayoutEffect(() => {
    const host = group.current;
    if (!host) return;
    const built = buildRig(host, bakeModel(source(), 3), bakeModel(target(), 3), seed);
    rig.current = built;
    return () => {
      host.clear();
      disposeBaked(built.from);
      disposeBaked(built.to);
      built.sparks.geometry.dispose();
      (built.sparks.material as Material).dispose();
      built.ring.geometry.dispose();
      (built.ring.material as Material).dispose();
      built.linkage.geometry.dispose();
      (built.linkage.material as Material).dispose();
      rig.current = null;
    };
  }, [source, target, seed]);

  useFrame(() => {
    const r = rig.current;
    const host = group.current;
    if (!r || !host) return;
    const local = clock.current?.local ?? 0;
    const p = clamp01((local - range[0]) / (range[1] - range[0]));
    host.visible = p < 1;
    if (!host.visible) return;
    const { q } = r;
    r.from.parts.forEach((part, i) => {
      const plan = r.plan.source[i];
      const e = easeInOutCubic(localProgress(p, plan.start, plan.duration));
      const mesh = r.source[i];
      mesh.visible = e < 1;
      // Source shell unlocks, folds inward, then disappears inside the core.
      mesh.position.copy(part.center).lerp(r.center, e * 0.88);
      mesh.position.addScaledVector(plan.dir, Math.sin(e * Math.PI) * plan.spread * 0.22);
      mesh.position.y += Math.sin(e * Math.PI) * plan.spread * 0.3;
      mesh.quaternion.copy(partRotation(q, plan, e));
      mesh.scale.setScalar(1 - 0.18 * smoothFold(e));
      setGlow(mesh.material as Material, Math.sin(e * Math.PI) * 2.8);
    });
    r.to.parts.forEach((part, j) => {
      const plan = r.plan.target[j];
      const f = localProgress(p, plan.start, plan.duration);
      const mesh = r.target[j];
      mesh.visible = f > 0;
      const unfold = easeOutBack(f);
      // Target panel leaves the compact core, swings past its latch, and locks.
      mesh.position.copy(r.center).lerp(part.center, unfold);
      mesh.position.addScaledVector(plan.dir, Math.sin(f * Math.PI) * plan.spread * 0.2);
      mesh.position.y += Math.sin(f * Math.PI) * plan.spread * 0.35;
      mesh.quaternion.copy(partRotation(q, plan, 1 - f));
      mesh.scale.setScalar(0.58 + 0.42 * Math.min(1, f * 1.5));
      const lock = plan.start + plan.duration;
      const flash = p >= lock ? Math.max(0, 1 - (p - lock) / 0.07) : f > 0.7 ? (f - 0.7) / 0.3 : 0;
      setGlow(mesh.material as Material, flash * 3.2);
    });
    const position = r.sparks.geometry.getAttribute("position");
    for (let i = 0; i < SPARKS; i += 1) {
      const owner = r.sparkOwner[i];
      const plan = r.plan.target[owner];
      const age = (p - (plan.start + plan.duration)) / SPARK_LIFE;
      const c = r.to.parts[owner].center;
      if (age < 0 || age > 1) {
        position.setXYZ(i, 0, -50, 0);
        continue;
      }
      const s = 0.35 * age;
      position.setXYZ(
        i,
        c.x + r.sparkVel[i * 3] * s,
        c.y + r.sparkVel[i * 3 + 1] * s - 1.4 * s * s,
        c.z + r.sparkVel[i * 3 + 2] * s,
      );
    }
    position.needsUpdate = true;
    const links = r.linkage.geometry.getAttribute("position");
    r.target.forEach((mesh, index) => {
      const active = mesh.visible && p < 0.94;
      links.setXYZ(index * 2, active ? r.center.x : 0, active ? r.center.y : -50, active ? r.center.z : 0);
      links.setXYZ(index * 2 + 1, active ? mesh.position.x : 0, active ? mesh.position.y : -50, active ? mesh.position.z : 0);
    });
    links.needsUpdate = true;
    (r.linkage.material as LineBasicMaterial).opacity = Math.sin(clamp01((p - 0.25) / 0.72) * Math.PI) * 0.72;
    const scan = localProgress(p, 0.24, 0.68);
    r.ring.position.set(r.center.x, r.to.bounds.min.y + scan * r.height * 1.05, r.center.z);
    r.ring.rotation.z = p * Math.PI * 8;
    (r.ring.material as MeshBasicMaterial).opacity = Math.sin(scan * Math.PI) * 0.95;
  });

  return <group ref={group} />;
}
