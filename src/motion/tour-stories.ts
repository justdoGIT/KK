import { boardLifecycle } from "../content/board-lifecycle.ts";
import { career } from "../content/career.ts";
import { TERMINAL_COMMANDS } from "../content/terminal.ts";
import { CAREER_STAGE_META, STAGE_STARTS } from "../scene/career/career-timeline.ts";
import { PHASE_SPANS } from "../components/ui/astronaut/journey-timeline.ts";
import { throwProgressFor } from "./throw-deck.ts";
import { all, carouselSteps, copy, flowCards, flowStep, layoutTop, one, pinnedY } from "./tour-dom.ts";
import type { TourStep } from "./tour-engine.ts";

export function serviceSteps(): TourStep[] {
  const mobile = carouselSteps("#services", "services");
  if (mobile) return mobile;
  const cards = all("#services .service-card-deck-item");
  if (!one(".services-throw")) return flowCards("#services", "services", "#services .service-card-deck-item");
  return cards.map((card, i) => ({
    id: `services-${i}`, chapter: "#services", label: card.querySelector("h3")?.textContent ?? "Services",
    target: () => pinnedY(".services-deck-track", throwProgressFor(i, cards.length)),
    text: () => card.innerText,
  }));
}

export function lifecycleSteps(): TourStep[] {
  const mobile = carouselSteps("#journey", "journey");
  if (mobile) return mobile;
  if (!one("#journey.is-animated")) return flowCards("#journey", "journey", ".board-lifecycle-static > li");
  return boardLifecycle.map((stage, i) => ({
    id: `journey-${i}`, chapter: "#journey", label: stage.title,
    target: () => pinnedY("#journey", (i + 0.18) / boardLifecycle.length),
    text: () => copy("#journey .board-lifecycle-copy"),
    seconds: 14,
  }));
}

export function caseSteps(): TourStep[] {
  const mobile = carouselSteps("#work", "work");
  if (mobile) return mobile;
  const animated = !!one("#work:not(.is-static)");
  return all("#work .lusion-card-front").map((_, i) => ({
    ...flowStep(`work-${i}`, "#work", "#work .lusion-card-front", i),
    ...(animated ? {
      target: () => pinnedY("#work", 0.76), end: undefined,
      ready: () => !!one("#work .lusion-cards-stage.is-settled"),
    } : {}),
    travelSeconds: animated && i === 0 ? 12 : 0,
    inner: () => all("#work .card-front-scroll-body")[i] ?? null,
  }));
}

export function careerSteps(): TourStep[] {
  const animated = !one(".career-journey--static");
  return CAREER_STAGE_META.map((meta, i) => {
    const entry = career.find((item) => item.id === meta.entryId)!;
    const from = STAGE_STARTS[i];
    const span = STAGE_STARTS[i + 1] - from;
    const trigger = () => one(`[aria-controls="disclosure-panel-${meta.entryId}"]`);
    const step = flowStep(`career-${i}`, "#career", ".career-entry", i);
    return {
      ...step, label: `${entry.title} · ${entry.organization}`,
      text: () => [entry.title, entry.organization, entry.period, entry.summary, ...entry.accomplishments, ...entry.technologies, meta.caption].join(" "),
      ...(animated ? {
        target: () => pinnedY("#career", from + span * 0.025),
        end: () => pinnedY("#career", from + span * 0.985),
        continuous: true, seconds: 28,
      } : {}),
      enter: () => { if (trigger()?.getAttribute("aria-expanded") !== "true") trigger()?.click(); },
    };
  });
}

export function terminalSteps(enhanced: boolean): TourStep[] {
  const animated = enhanced && !one(".terminal-flow");
  return TERMINAL_COMMANDS.map((command, i) => ({
    id: `terminal-${i}`, chapter: ".terminal-scroll-section", label: command.tabTitle,
    target: () => animated
      ? pinnedY(".terminal-scroll-section", 0.2 + 0.8 * (i + 0.997) / TERMINAL_COMMANDS.length)
      : layoutTop(one(".terminal-scroll-section")) - 64,
    text: () => [command.command, ...command.output].join(" "),
    inner: () => one(".terminal-body"),
    travelSeconds: animated ? 6 : 0,
    enter: () => { if (!animated) all(".terminal-tab")[i]?.click(); },
    ready: () => !!one(".terminal-exit-code"),
  }));
}

export function skillSteps(): TourStep[] {
  const chapter = ".skill-domains-section";
  const mobile = carouselSteps(chapter, "skills");
  if (mobile) return mobile;
  const cards = all(".skill-card-reveal");
  const stage = one(".skill-domains-stage");
  if (!stage || getComputedStyle(stage).position !== "sticky") return flowCards(chapter, "skills", ".skill-card-reveal");
  return cards.map((_, i) => ({
    id: `skills-${i}`, chapter,
    label: cards[i].querySelector("h3")?.textContent ?? "Skill domains",
    target: () => pinnedY(chapter, (i + 1) / cards.length * 0.86 + 0.002),
    text: () => all(".skill-card-reveal")[i]?.innerText ?? "",
  }));
}

export function contactSteps(): TourStep[] {
  if (!one(".aj-section")) return [flowStep("contact", "#contact", "#contact")];
  const position = (p: number) => one(".aj-section") ? pinnedY(".aj-section", p) : layoutTop(one("#contact")) - 64;
  const end = PHASE_SPANS.drop.to + 0.025;
  return [
    {
      id: "contact-scene", chapter: "#contact", label: "One last journey",
      target: () => position(0),
      end: () => position(end),
      text: () => copy(".aj-intro"), seconds: 38, continuous: true,
      ready: () => one(".aj-stage")?.dataset.sceneReady === "true" || !!one(".aj-fallback"),
    },
    {
      ...(one(".aj-contact-flow") ? flowStep("contact", "#contact", ".aj-contact-flow") : {
        target: () => position(Math.max(end, 0.9)),
      }),
      id: "contact", chapter: "#contact", label: "Start a conversation",
      text: () => copy(".contact-banner"), seconds: 14,
    },
  ];
}
