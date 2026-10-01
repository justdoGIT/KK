// One requestAnimationFrame loop for every scroll-linked driver and render
// loop on the page. Each frame first advances smooth scrolling, then runs
// every `read` subscriber (layout and scroll reads only), then every `write`
// (DOM and style writes, clock updates), then every `render` (WebGL frames).
// No subscriber reads layout another one dirtied, and every layer paints from
// the same scroll position in the same frame. The loop stops when nothing is
// subscribed.

export type FramePhase = "scroll" | "read" | "write" | "render";
/** `time` is the rAF timestamp in ms; `delta` the seconds since the previous frame (clamped to 0.1). */
export type FrameCallback = (time: number, delta: number) => void;

const PHASES: readonly FramePhase[] = ["scroll", "read", "write", "render"];
const subscribers: Record<FramePhase, Set<FrameCallback>> = {
  scroll: new Set(),
  read: new Set(),
  write: new Set(),
  render: new Set(),
};
let rafId = 0;
let last = 0;

function tick(time: number): void {
  rafId = requestAnimationFrame(tick);
  const delta = last > 0 ? Math.min(0.1, Math.max(0, (time - last) / 1000)) : 0;
  last = time;
  for (const phase of PHASES) {
    for (const callback of subscribers[phase]) callback(time, delta);
  }
}

/** Runs `callback` every frame in `phase` until the returned function is called. */
export function onFrame(phase: FramePhase, callback: FrameCallback): () => void {
  subscribers[phase].add(callback);
  if (!rafId) {
    last = 0;
    rafId = requestAnimationFrame(tick);
  }
  return () => {
    subscribers[phase].delete(callback);
    if (rafId && PHASES.every((p) => subscribers[p].size === 0)) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };
}
