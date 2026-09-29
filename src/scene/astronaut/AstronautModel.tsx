import { useImperativeHandle, useRef, type JSX, type Ref, type RefObject } from "react";
import type { Group, Material, Mesh } from "three";
import type { AstronautGeometry, AstronautMaterials } from "./astronaut-kit.ts";
import type { JointName } from "./astronaut-poses.ts";

export type JointRefs = Record<JointName, RefObject<Group | null>>;

export type AstronautHandle = {
  root: Group | null;
  joints: JointRefs;
  led: Mesh | null;
  materials: AstronautMaterials;
};

type PartProps = {
  geometry: AstronautGeometry[keyof AstronautGeometry];
  material: Material;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
};

function Part({ geometry, material, position, rotation, scale }: PartProps): JSX.Element {
  return (
    <mesh
      geometry={geometry}
      material={material}
      position={position}
      rotation={rotation}
      scale={scale}
      dispose={null}
    />
  );
}

const HALF_PI = Math.PI / 2;

type LimbProps = {
  side: -1 | 1;
  geo: AstronautGeometry;
  mat: AstronautMaterials;
  shoulderRef: RefObject<Group | null>;
  elbowRef: RefObject<Group | null>;
};

function Arm({ side, geo, mat, shoulderRef, elbowRef }: LimbProps): JSX.Element {
  return (
    <group ref={shoulderRef} position={[0.33 * side, 0.56, 0]}>
      <Part geometry={geo.shoulderCap} material={mat.suit} />
      <Part geometry={geo.upperArm} material={mat.suit} position={[0, -0.19, 0]} />
      <group ref={elbowRef} position={[0, -0.37, 0]}>
        <Part geometry={geo.forearm} material={mat.suit} position={[0, -0.17, 0]} />
        <Part geometry={geo.cuff} material={mat.trim} position={[0, -0.32, 0]} rotation={[HALF_PI, 0, 0]} />
        <group position={[0, -0.36, 0]}>
          <Part geometry={geo.palm} material={mat.suit} position={[0, -0.05, 0]} />
          {[-0.036, -0.012, 0.012, 0.036].map((x) => (
            <Part key={x} geometry={geo.finger} material={mat.suit} position={[x, -0.13, 0]} />
          ))}
          <Part
            geometry={geo.thumb}
            material={mat.suit}
            position={[-0.06 * side, -0.07, 0.01]}
            rotation={[0, 0, -0.6 * side]}
          />
        </group>
      </group>
    </group>
  );
}

type LegProps = {
  side: -1 | 1;
  geo: AstronautGeometry;
  mat: AstronautMaterials;
  hipRef: RefObject<Group | null>;
  kneeRef: RefObject<Group | null>;
};

function Leg({ side, geo, mat, hipRef, kneeRef }: LegProps): JSX.Element {
  return (
    <group ref={hipRef} position={[0.12 * side, -0.06, 0]}>
      <Part geometry={geo.thigh} material={mat.suit} position={[0, -0.23, 0]} />
      <group ref={kneeRef} position={[0, -0.46, 0]}>
        <Part geometry={geo.kneePad} material={mat.trim} position={[0, 0, 0.09]} rotation={[HALF_PI, 0, 0]} />
        <Part geometry={geo.shin} material={mat.suit} position={[0, -0.21, 0]} />
        <Part geometry={geo.boot} material={mat.trim} position={[0, -0.46, 0.04]} />
      </group>
    </group>
  );
}

type AstronautModelProps = {
  geometry: AstronautGeometry;
  materials: AstronautMaterials;
  withLed?: boolean;
  ref?: Ref<AstronautHandle>;
};

/** Procedural spacesuit rig: pelvis origin, ~2.2 units tall, faces +Z. */
export function AstronautModel({ geometry: geo, materials: mat, withLed = false, ref }: AstronautModelProps): JSX.Element {
  const rootRef = useRef<Group>(null);
  const ledRef = useRef<Mesh>(null);

  const torsoRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const shoulderLRef = useRef<Group>(null);
  const elbowLRef = useRef<Group>(null);
  const shoulderRRef = useRef<Group>(null);
  const elbowRRef = useRef<Group>(null);
  const hipLRef = useRef<Group>(null);
  const kneeLRef = useRef<Group>(null);
  const hipRRef = useRef<Group>(null);
  const kneeRRef = useRef<Group>(null);

  useImperativeHandle(
    ref,
    () => ({
      get root() {
        return rootRef.current;
      },
      get led() {
        return ledRef.current;
      },
      joints: {
        torso: torsoRef,
        head: headRef,
        shoulderL: shoulderLRef,
        elbowL: elbowLRef,
        shoulderR: shoulderRRef,
        elbowR: elbowRRef,
        hipL: hipLRef,
        kneeL: kneeLRef,
        hipR: hipRRef,
        kneeR: kneeRRef,
      },
      materials: mat,
    }),
    [mat],
  );

  return (
    <group ref={rootRef}>
      <Part geometry={geo.pelvis} material={mat.suit} />
      <group ref={torsoRef} position={[0, 0.1, 0]}>
        <Part geometry={geo.torso} material={mat.suit} position={[0, 0.32, 0]} />
        <Part geometry={geo.chestBox} material={mat.trim} position={[0, 0.43, 0.19]} />
        <Part geometry={geo.zip} material={mat.trim} position={[0, 0.3, 0.182]} />
        <Part geometry={geo.strap} material={mat.trim} position={[-0.13, 0.46, 0.18]} />
        <Part geometry={geo.strap} material={mat.trim} position={[0.13, 0.46, 0.18]} />
        <Part geometry={geo.port} material={mat.dark} position={[-0.15, 0.13, 0.172]} rotation={[HALF_PI, 0, 0]} />
        <Part geometry={geo.port} material={mat.dark} position={[0.15, 0.13, 0.172]} rotation={[HALF_PI, 0, 0]} />
        <Part geometry={geo.backpack} material={mat.suit} position={[0, 0.34, -0.26]} />
        <Part geometry={geo.neckRing} material={mat.trim} position={[0, 0.66, 0]} rotation={[HALF_PI, 0, 0]} />
        <group ref={headRef} position={[0, 0.8, 0]}>
          <Part geometry={geo.helmet} material={mat.suit} />
          <Part geometry={geo.visor} material={mat.visor} position={[0, -0.005, 0.135]} scale={[1, 0.78, 0.62]} />
          <Part geometry={geo.visorRim} material={mat.trim} position={[0, -0.005, 0.19]} scale={[1.02, 0.8, 1]} />
          <Part geometry={geo.ear} material={mat.trim} position={[-0.235, 0, 0]} rotation={[0, 0, HALF_PI]} />
          <Part geometry={geo.ear} material={mat.trim} position={[0.235, 0, 0]} rotation={[0, 0, HALF_PI]} />
          {withLed ? (
            <mesh ref={ledRef} geometry={geo.led} material={mat.led} position={[0, 0, 0.268]} dispose={null} />
          ) : null}
        </group>
        <Arm side={-1} geo={geo} mat={mat} shoulderRef={shoulderLRef} elbowRef={elbowLRef} />
        <Arm side={1} geo={geo} mat={mat} shoulderRef={shoulderRRef} elbowRef={elbowRRef} />
      </group>
      <Leg side={-1} geo={geo} mat={mat} hipRef={hipLRef} kneeRef={kneeLRef} />
      <Leg side={1} geo={geo} mat={mat} hipRef={hipRRef} kneeRef={kneeRRef} />
    </group>
  );
}
