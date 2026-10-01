import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { onFrame } from "../motion/frame.ts";

/**
 * Renders the enclosing `<Canvas frameloop="never">` from the shared frame
 * scheduler's render phase while `active`, i.e. after every scroll driver has
 * read layout and written its clock for this frame. A pinned 3D layer then
 * paints from the same scroll position as the DOM layers around it instead of
 * trailing them by a frame. R3F's `advance` takes seconds.
 */
export function SchedulerFrames({ active }: { active: boolean }): null {
  const advance = useThree((state) => state.advance);
  useEffect(() => {
    if (!active) return;
    return onFrame("render", (time) => advance(time / 1000));
  }, [active, advance]);
  return null;
}
