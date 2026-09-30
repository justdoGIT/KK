import { describe, expect, it } from "vitest";
import { PerspectiveCamera } from "three";
import { IMPACT_AT, PHASE_SPANS, heroUnmasked, shatterRatio } from "../components/ui/astronaut/journey-timeline.ts";
import { createFinaleClock } from "../scene/astronaut/journey-clock.ts";
import { contactRoot, createRootPose, heroRoot } from "../scene/astronaut/hero-motion.ts";
import { landingAnchor } from "../scene/astronaut/landing-panel.ts";
import {
  CAREER_STAGE_COUNT,
  STAGE_STARTS,
  careerStageAt,
  morphProgress,
} from "../scene/career/career-timeline.ts";

function phasePoint(from: number, to: number, ratio: number): number {
  return from + (to - from) * ratio;
}

describe("scroll choreography", () => {
  it("holds intact glass until the astronaut kick reaches its impact frame", () => {
    const span = PHASE_SPANS.frameBreak;
    const before = phasePoint(span.from, span.to, IMPACT_AT - 0.01);
    const impact = phasePoint(span.from, span.to, IMPACT_AT);
    const after = phasePoint(span.from, span.to, IMPACT_AT + 0.27);

    expect(shatterRatio(before)).toBe(0);
    expect(heroUnmasked(before)).toBe(false);
    expect(shatterRatio(impact)).toBeCloseTo(0, 12);
    expect(heroUnmasked(impact)).toBe(true);
    expect(shatterRatio(after)).toBeGreaterThan(0);
  });

  it("maps every career boundary to its next robot and restarts its morph", () => {
    expect(STAGE_STARTS).toHaveLength(CAREER_STAGE_COUNT + 1);
    for (let stage = 0; stage < CAREER_STAGE_COUNT; stage += 1) {
      const state = careerStageAt(STAGE_STARTS[stage]);
      expect(state.stage).toBe(stage);
      expect(state.local).toBe(0);
      expect(morphProgress(state.local)).toBe(0);
    }
    expect(careerStageAt(1)).toEqual({ stage: CAREER_STAGE_COUNT - 1, local: 1 });
  });

  it("holds the drop's ending pose through the wait phase (contactRoot lands it)", () => {
    const landed = heroRoot(PHASE_SPANS.drop.to, 0, createRootPose());
    const held = heroRoot(PHASE_SPANS.wait.to, 0, createRootPose());

    expect(held.y).toBeCloseTo(landed.y, 6);
    expect(held.z).toBeCloseTo(landed.z, 6);
    expect(held.scale).toBeCloseTo(landed.scale, 6);
  });

  it("carries the root onto the landing panel as finale progress crosses the land window", () => {
    const camera = new PerspectiveCamera(35, 1, 0.1, 80);
    camera.position.z = 6;
    const finale = createFinaleClock();
    finale.cardLeft = 200;
    finale.cardTop = 400;
    finale.cardWidth = 600;
    finale.footX = 410;
    finale.bodyHeight = 260;

    const before = createRootPose();
    const anchor = landingAnchor(finale, camera, 1000, 800);
    expect(anchor).not.toBeNull();
    if (!anchor) return;

    const untouched = contactRoot(anchor, "stand", -0.9, 0, 0, { ...before });
    expect(untouched).toEqual(before);

    const landed = contactRoot(anchor, "stand", -0.9, 1, 0, createRootPose());
    expect(landed.scale).toBeCloseTo(anchor.scale, 6);
    expect(landed.x).toBeCloseTo(anchor.x, 6);
    expect(Number.isFinite(landed.y)).toBe(true);
    expect(Number.isFinite(landed.z)).toBe(true);
  });
});
