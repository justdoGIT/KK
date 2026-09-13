import { createContext } from "react";
import type { MotionMode } from "./motion-types.ts";

export const MotionModeContext = createContext<MotionMode>("native");
