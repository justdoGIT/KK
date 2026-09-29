import { describe, expect, it } from "vitest";
import {
  IMPACT_AT,
  PHASE_SPANS,
  heroUnmasked,
  shatterRatio,
} from "../components/ui/astronaut/journey-timeline.ts";
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
});
