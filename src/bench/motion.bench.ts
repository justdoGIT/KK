import { test } from "vitest";
import {
  frameRect,
  heroUnmasked,
  phaseAt,
} from "../components/ui/astronaut/journey-timeline.ts";
import {
  bannerState,
  contactPoseMode,
} from "../components/ui/contact/banner-timeline.ts";
import {
  terminalState,
  type TerminalState,
} from "../components/ui/terminal-runner.ts";
import { TERMINAL_COMMANDS } from "../content/terminal.ts";
import { guidedCruise } from "../motion/guided-scroll.ts";
import { diceTimeline } from "../motion/metrics-dice.ts";
import { throwFrame, throwPose } from "../motion/throw-deck.ts";

// Scroll-driven choreography runs on every animation frame. Each benchmark
// sweeps the full 0..1 progress range, simulating a complete scroll through
// the section, so regressions in per-frame math show up clearly.
const STEPS = 1000;
const progress = Array.from({ length: STEPS + 1 }, (_, i) => i / STEPS);

test("scroll choreography", async ({ bench }) => {
  await bench.compare(
    bench("journey frameRect full scroll", () => {
      for (const t of progress) {
        frameRect(t, 1440, 900);
        phaseAt(t);
        heroUnmasked(t);
      }
    }),
    bench("throw-deck poses full scroll (6 cards)", () => {
      const count = 6;
      for (const p of progress) {
        const frame = throwFrame(p, count);
        for (let i = 0; i < count; i++) throwPose(i, frame, count);
      }
    }),
    bench("terminal script full scroll", () => {
      let state: TerminalState = { cmdIndex: 0, typedChars: null, lines: 0 };
      for (const p of progress) {
        state = terminalState(p, state, TERMINAL_COMMANDS);
      }
    }),
    bench("contact banner and pose full scroll", () => {
      for (const p of progress) {
        bannerState(p, p * 4);
        contactPoseMode(p, "none", p * 120);
        contactPoseMode(p, "dance", p * 20);
      }
    }),
    bench("metrics dice timeline full scroll", () => {
      for (const p of progress) diceTimeline(p);
    }),
    bench("guided cruise full scroll", () => {
      const pace = { target: 0.8, seconds: 12 };
      for (const p of progress) guidedCruise(p, 2400, 5400, pace);
    }),
  );
});
