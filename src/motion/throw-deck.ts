import { clamp01, easeOutCubic } from "./scroll-frame.ts";

/**
 * Two players face each other across the table. Each card waits for its own
 * scroll interval, enters almost edge-on from alternating sides, lands
 * skewed, and straightens before the next throw. The edge-on approach keeps
 * the flying card's projected face inside this section instead of washing
 * across adjacent content.
 */
export const THROW_FLIGHT = 0.55;
export const STACK_STEP_PX = 12;
const START_FRAME = -0.28;

export type ThrowPose = {
  transform: string;
  opacity: number;
  visible: boolean;
  settled: boolean;
  /** 0..1: how far a newer card covers this one (its content fades; the edge stays). */
  covered: number;
};

/** Scroll progress 0..1 → deck frame (card i is thrown during [i, i+1]). */
export function throwFrame(progress: number, count: number): number {
  return START_FRAME + clamp01(progress) * (count + 0.2 - START_FRAME);
}

/** Inverse of throwFrame: progress at which card `index` has just straightened. */
export function throwProgressFor(index: number, count: number): number {
  return clamp01((index + 1 - START_FRAME) / (count + 0.2 - START_FRAME));
}

export function throwPose(index: number, frame: number, count: number): ThrowPose {
  const dir = index % 2 === 0 ? -1 : 1;
  const landTilt = dir * (7 + (index % 3) * 3); // skewed, facing the thrower
  const rest = index * STACK_STEP_PX;
  const local = frame - index;
  if (local <= 0) return { transform: "", opacity: 0, visible: false, settled: false, covered: 0 };

  if (local < THROW_FLIGHT) {
    const flight = local / THROW_FLIGHT;
    const e = easeOutCubic(flight);
    const x = dir * 105 * (1 - e);
    const y = rest - Math.sin(Math.PI * e) * 42;
    const spin = landTilt + dir * 90 * (1 - e);
    const yaw = -dir * 86 * (1 - flight);
    return {
      transform: `translate3d(${x.toFixed(2)}vw, ${y.toFixed(1)}px, 0) rotateY(${yaw.toFixed(1)}deg) rotateZ(${spin.toFixed(1)}deg) scale(${(0.88 + 0.12 * e).toFixed(3)})`,
      opacity: clamp01((flight - 0.18) / 0.32),
      visible: true,
      settled: false,
      covered: 0,
    };
  }

  // Landed: the skew straightens out as the reader keeps scrolling.
  const straighten = easeOutCubic(clamp01((local - THROW_FLIGHT) / (1 - THROW_FLIGHT)));
  const tilt = landTilt * (1 - straighten);
  const shift = dir * 2.5 * (1 - straighten);
  return {
    transform: straighten >= 1
      ? (rest === 0 ? "none" : `translate3d(0, ${rest}px, 0)`)
      : `translate3d(${shift.toFixed(2)}vw, ${rest}px, 0) rotateZ(${tilt.toFixed(2)}deg)`,
    opacity: 1,
    visible: true,
    settled: straighten >= 1,
    // The next card lands at local ≈ 1 + THROW_FLIGHT; fade this card's content
    // as it arrives so the translucent glass never shows two layers of text.
    covered: index < count - 1 ? clamp01((local - 1.3) / 0.3) : 0,
  };
}
