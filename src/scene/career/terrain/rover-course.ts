import { CatmullRomCurve3, Vector3 } from "three";

/** Capgemini stage course: crates/barrels and pits the rover must weave around. */
export type Hazard = { kind: "crate" | "barrel" | "pit"; x: number; z: number; r: number };

export const HAZARDS: readonly Hazard[] = [
  { kind: "crate", x: -2.8, z: 0.35, r: 0.5 },
  { kind: "pit", x: -1.3, z: -0.75, r: 0.55 },
  { kind: "barrel", x: 0, z: 0.8, r: 0.45 },
  { kind: "pit", x: 1.4, z: -0.35, r: 0.6 },
  { kind: "crate", x: 2.9, z: 0.75, r: 0.5 },
  { kind: "pit", x: 3.9, z: -0.9, r: 0.45 },
];

export const ROVER_START = new Vector3(-5.6, 0, 0);

/** Slalom waypoints chosen with ≥1.1 m clearance from every hazard centre. */
export const ROVER_PATH = new CatmullRomCurve3(
  [
    ROVER_START.clone(),
    new Vector3(-4, 0, 0),
    new Vector3(-2.8, 0, -0.75),
    new Vector3(-1.4, 0, 0.45),
    new Vector3(0, 0, -0.4),
    new Vector3(1.4, 0, 0.75),
    new Vector3(2.8, 0, -0.35),
    new Vector3(4.2, 0, 0.4),
    new Vector3(6.2, 0, 0.2),
  ],
  false,
  "centripetal",
);

export const ROVER_LENGTH = ROVER_PATH.getLength();

/** LiDAR range used to flag hazards as detected. */
export const LIDAR_RANGE = 2.6;
