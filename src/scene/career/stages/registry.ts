import type { JSX } from "react";
import type { CareerClockRef } from "../career-clock.ts";
import { HumanoidStage } from "./HumanoidStage.tsx";
import { RocketStage } from "./RocketStage.tsx";
import { QuadrupedStage } from "./QuadrupedStage.tsx";
import { RoverStage } from "./RoverStage.tsx";
import { WallFollowerStage } from "./WallFollowerStage.tsx";

export type StageProps = {
  /** Mutable clock written by the DOM driver, read in useFrame. */
  clock: CareerClockRef;
  /** This stage's index; a stage renders and owns the camera only while `clock.stage === index`. */
  index: number;
};

/** Career stages in journey order (oldest role first); index matches CAREER_STAGE_META. */
export const CAREER_STAGES: readonly ((props: StageProps) => JSX.Element)[] = [
  WallFollowerStage,
  RoverStage,
  QuadrupedStage,
  HumanoidStage,
  RocketStage,
];
