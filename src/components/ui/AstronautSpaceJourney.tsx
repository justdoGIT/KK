import { Suspense, lazy, useMemo, useRef, useState } from "react";
import type { FocusEvent, JSX, PointerEvent, ReactNode } from "react";
import { useMotionMode } from "../../motion/use-motion-mode.ts";
import { checkWebGL } from "../../scene/useCapability.ts";
import type { JourneyClock } from "../../scene/astronaut/journey-clock.ts";
import { createFinaleClock } from "../../scene/astronaut/journey-clock.ts";
import { SpaceBackdrop, AstronautFigure } from "./AstronautArtwork.tsx";
import { JOURNEY_VIEWPORTS } from "./astronaut/journey-timeline.ts";
import { useJourneyDriver, type JourneyElements } from "./astronaut/useJourneyDriver.ts";

// One pinned scene owns the glass break, landing deck, greeting, contact card,
// and foreground astronaut. The shared clock keeps the DOM and R3F layers in
// lockstep through the finale.

const WorldCanvas = lazy(() =>
  import("../../scene/astronaut/JourneyCanvases.tsx").then((m) => ({ default: m.WorldCanvas })),
);
const HeroCanvas = lazy(() =>
  import("../../scene/astronaut/JourneyCanvases.tsx").then((m) => ({ default: m.HeroCanvas })),
);

const TITLE_LINES = ["Step into a new orbit", "and let your", "silicon run wild"];

function actionFrom(target: EventTarget | null): "none" | "dance" | "wait" {
  if (!(target instanceof Element)) return "none";
  const action = target.closest<HTMLElement>("[data-astronaut-action]")?.dataset.astronautAction;
  return action === "dance" || action === "wait" ? action : "none";
}

function ImmersiveJourney({ children }: { children?: ReactNode }): JSX.Element {
  const section = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const theme = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const cardEdge = useRef<HTMLDivElement>(null);
  const bezel = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const contact = useRef<HTMLDivElement>(null);
  const contactMover = useRef<HTMLDivElement>(null);
  const contactHeading = useRef<HTMLHeadingElement>(null);
  const titleLines = useRef<(HTMLElement | null)[]>([]);
  const clock = useRef<JourneyClock>({ t: 0, width: 1, height: 1, finale: createFinaleClock() });

  const els = useMemo<JourneyElements>(
    () => ({
      section, stage, backdrop, theme, world, hero, cardEdge, bezel, intro,
      contact, contactMover, contactHeading, titleLines, clock,
    }),
    [],
  );
  const { near, active } = useJourneyDriver(els);

  const updateInteraction = (target: EventTarget | null) => {
    clock.current.finale.interaction = actionFrom(target);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const finale = clock.current.finale;
    finale.cursorX = event.clientX;
    finale.cursorY = event.clientY;
    finale.lastPointerAt = performance.now() / 1000;
    updateInteraction(event.target);
  };
  const onPointerLeave = () => {
    clock.current.finale.interaction = "none";
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => updateInteraction(event.target);
  const onFocus = (event: FocusEvent<HTMLDivElement>) => updateInteraction(event.target);
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      clock.current.finale.interaction = "none";
    }
  };

  return (
    <div
      ref={section}
      className="aj-section"
      style={{ height: `${JOURNEY_VIEWPORTS * 100}vh` }}
      aria-label="Mission launch sequence"
      role="region"
   >
      <div ref={stage} className="aj-stage" data-phase="cardShow">
        <div ref={backdrop} className="aj-backdrop" aria-hidden="true" />
        <div ref={theme} className="aj-theme" aria-hidden="true" />
        <div ref={world} className="aj-layer aj-world" aria-hidden="true">
          {near ? (
            <Suspense fallback={null}>
              <WorldCanvas clock={clock} active={active} />
            </Suspense>
          ) : null}
        </div>
        <div ref={cardEdge} className="aj-card-edge" aria-hidden="true" />
        <div ref={bezel} className="aj-bezel" aria-hidden="true" />
        <div ref={intro} className="aj-intro">
          <span className="aj-kicker">Mission control</span>
          <p className="aj-intro-title">Where embedded ideas become immersive missions</p>
        </div>
        <div ref={hero} className="aj-layer aj-hero" aria-hidden="true">
          {near ? (
            <Suspense fallback={null}>
              <HeroCanvas clock={clock} active={active} />
            </Suspense>
          ) : null}
        </div>
        {children ? (
          <div
            ref={contact}
            className="contact-banner contact-banner--animated"
            data-astronaut-mode="landing"
            data-finale-progress="0"
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            onPointerDown={onPointerDown}
            onFocus={onFocus}
            onBlur={onBlur}
          >
            <div className="contact-banner-stage">
              <h2 ref={contactHeading} className="contact-journey-heading">
                Let’s innovate together
              </h2>
              <div ref={contactMover} className="contact-banner-mover">
                <div className="contact-card">{children}</div>
              </div>
            </div>
          </div>
        ) : null}
        <p className="aj-title">
          {TITLE_LINES.map((line, i) => (
            <span
              key={line}
              ref={(el) => {
                titleLines.current[i] = el;
              }}
            >
              {line}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

/** Static launch illustration for reduced motion or browsers without WebGL. */
function JourneyFallback({ children }: { children?: ReactNode }): JSX.Element {
  return (
    <div className="aj-fallback" aria-label="Mission launch and contact" role="region">
      <svg className="aj-fallback-art" viewBox="0 0 1000 520" aria-hidden="true">
        <SpaceBackdrop idPrefix="fallback" />
        <AstronautFigure isWaving />
      </svg>
      {children ? (
        <div className="contact-banner contact-banner--static">
          <h2 className="contact-journey-heading">Let’s innovate together</h2>
          <div className="contact-card">{children}</div>
        </div>
      ) : null}
    </div>
  );
}

export function AstronautSpaceJourney({ children }: { children?: ReactNode }): JSX.Element {
  const enhanced = useMotionMode() === "enhanced";
  const [webgl] = useState(checkWebGL);
  return enhanced && webgl
    ? <ImmersiveJourney>{children}</ImmersiveJourney>
    : <JourneyFallback>{children}</JourneyFallback>;
}
