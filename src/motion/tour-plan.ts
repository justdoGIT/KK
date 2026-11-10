import { all, carouselSteps, copy, flowCards, flowStep, layoutTop, one } from "./tour-dom.ts";
import { careerSteps, caseSteps, contactSteps, lifecycleSteps, serviceSteps, skillSteps, terminalSteps } from "./tour-stories.ts";
import type { TourStep } from "./tour-engine.ts";

export function buildTourPlan(enhanced: boolean): TourStep[] {
  const steps: TourStep[] = [flowStep("hero", "#hero", "#hero")];
  if (one(".metrics-document-animated")) {
    const position = (p: number) => {
      const section = one(".metrics-document-section")!;
      const stage = one(".metrics-document-stage")!;
      return layoutTop(section) - (parseFloat(getComputedStyle(stage).top) || 0)
        + (section.offsetHeight - stage.offsetHeight) * p;
    };
    steps.push({ id: "metrics", chapter: ".client-metrics-strip", label: "Experience & impact",
      target: () => position(0.04), end: () => position(0.9), text: () => copy(".metrics-document-paper"),
      continuous: true, seconds: 30 });
  } else steps.push(flowStep("metrics", ".client-metrics-strip", ".client-metrics-strip"));

  const chapters: [string, string, () => TourStep[]][] = [
    ["#services", "services", serviceSteps], ["#journey", "journey", lifecycleSteps], ["#work", "work", caseSteps],
    ["#visual-lab", "lab", () => carouselSteps("#visual-lab", "lab") ?? flowCards("#visual-lab", "lab", ".system-showcase-card")],
    ["#approach", "approach", () => carouselSteps("#approach", "approach") ?? flowCards("#approach", "approach", ".process-step-card")],
    ["#offers", "offers", () => carouselSteps("#offers", "offers") ?? flowCards("#offers", "offers", ".offer-card")],
    ["#career", "career", careerSteps],
    [".terminal-scroll-section", "terminal", () => terminalSteps(enhanced)],
    [".skill-domains-section", "skills", skillSteps],
  ];
  for (const [chapter, prefix, content] of chapters) {
    const heading = `${chapter} .section-header, ${chapter} .board-lifecycle-header, ${chapter} .career-header, ${chapter} .lusion-deck-header`;
    if (all(heading).length) {
      const step = flowStep(`${prefix}-heading`, chapter, heading);
      if ((prefix === "career" && !one(".career-journey--static")) || (prefix === "work" && one("#work:not(.is-static)"))) {
        step.target = () => layoutTop(one(chapter)) - 64;
        step.end = undefined;
      }
      steps.push(step);
    }
    steps.push(...content());
  }
  steps.push(...contactSteps(), {
    ...flowStep("footer", ".footer", ".footer"),
    target: () => document.documentElement.scrollHeight - innerHeight,
    end: undefined,
    label: "End of tour",
  });
  return steps;
}
