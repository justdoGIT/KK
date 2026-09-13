import { useContext } from "react";
import { MotionModeContext } from "./motion-context.ts";
import type { MotionMode } from "./motion-types.ts";

export function useMotionMode(): MotionMode {
  return useContext(MotionModeContext);
}
