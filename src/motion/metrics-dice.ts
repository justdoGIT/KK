import { clamp01 } from "./scroll-frame.ts";

/**
 * Six square tiles in a straight row (columns 0..5, side W) folded into a
 * cube. Columns 1–4 form the band (4 = front/anchor, 3 = left, 2 = back,
 * 1 = right); column 5 is the lid, hinged to the anchor's top edge, and
 * column 0 the floor, hinged to column 1's bottom edge. Opening swings each
 * flap flat, then slides it sideways into its slot so the net ends as a row.
 */
export type DiceTimeline = {
  roll: number; // 0 = cube at column 0, 1 = cube resting on column 4
  tilt: number; // 1 = presentation tilt, 0 = face-on
  band: [number, number, number]; // unfold of hinges 4|3, 3|2, 2|1 (0 folded … 1 flat)
  flaps: number; // lid/floor hinge unfold
  slideX: number; // flap slide along the row
  slideY: number; // flap slide into the row
};

const smooth = (t: number) => t * t * (3 - 2 * t);
const span = (p: number, a: number, b: number) => smooth(clamp01((p - a) / (b - a)));

/** Roll left → right, then open right → left, then move the side flaps into line. */
export function diceTimeline(p: number): DiceTimeline {
  return {
    roll: span(p, 0, 0.36),
    tilt: 1 - span(p, 0.36, 0.5),
    band: [span(p, 0.42, 0.6), span(p, 0.52, 0.7), span(p, 0.62, 0.8)],
    flaps: span(p, 0.46, 0.64),
    slideX: span(p, 0.78, 0.9),
    slideY: span(p, 0.88, 1),
  };
}

/** CSS transforms (transform-origin 0 0) for each column at timeline `t`. */
export function diceTransforms(t: DiceTimeline, W: number): DOMMatrix[] {
  const hop = Math.abs(Math.sin(t.roll * Math.PI * 4)) * (1 - t.roll) * 0.3 * W;
  const anchor = new DOMMatrix()
    .translate(-4 * W * (1 - t.roll), -hop, 0)
    .translate(4.5 * W, 0.5 * W, -0.5 * W) // spin about the cube centre
    .rotateAxisAngle(1, 0, 0, -16 * t.tilt)
    .rotateAxisAngle(0, 1, 0, -26 * t.tilt)
    .rotateAxisAngle(0, 0, 1, -360 * (1 - t.roll))
    .translate(-4.5 * W, -0.5 * W, 0.5 * W);
  const hinge = (parent: DOMMatrix, x: number, fold: number) =>
    parent.translate(x, 0, 0).rotateAxisAngle(0, 1, 0, -90 * (1 - fold)).translate(-x, 0, 0);
  const c3 = hinge(anchor, 4 * W, t.band[0]);
  const c2 = hinge(c3, 3 * W, t.band[1]);
  const c1 = hinge(c2, 2 * W, t.band[2]);
  const flap = 90 * (1 - t.flaps);
  const lid = anchor
    .rotateAxisAngle(1, 0, 0, flap)
    .translate(-W * (1 - t.slideX), -W * (1 - t.slideY), 0);
  const floor = c1
    .translate(0, W, 0).rotateAxisAngle(1, 0, 0, -flap).translate(0, -W, 0)
    .translate(W * (1 - t.slideX), W * (1 - t.slideY), 0);
  // World-space poses → per-element transforms relative to each column's layout slot.
  return [floor, c1, c2, c3, anchor, lid].map((world, i) =>
    new DOMMatrix().translate(-i * W, 0, 0).multiply(world).translate(i * W, 0, 0));
}
