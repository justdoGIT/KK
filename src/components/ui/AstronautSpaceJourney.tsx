import { Suspense, lazy, useMemo, useRef, useState, type JSX } from "react";
import { useMotionMode } from "../../motion/use-motion-mode.ts";
import { checkWebGL } from "../../scene/useCapability.ts";
import type { JourneyClock } from "../../scene/astronaut/journey-clock.ts";
import { SpaceBackdrop, AstronautFigure } from "./AstronautArtwork.tsx";
import { JOURNEY_VIEWPORTS } from "./astronaut/journey-timeline.ts";
import { JourneyEndContent } from "./astronaut/JourneyEndContent.tsx";
import { useJourneyDriver, type JourneyElements } from "./astronaut/useJourneyDriver.ts";

// Contact finale modelled on Lusion's "Where creative ideas become immersive
// experiences" sequence: a small card opens into a fullscreen window onto
// space, the astronaut free-falls through a tunnel, the view shrinks into a
// 16:9 screen, the astronaut shatters the glass, flies up close and waves.

const WorldCanvas = lazy(() =>
  import("../../scene/astronaut/JourneyCanvases.tsx").then((m) => ({ default: m.WorldCanvas })),
);
const HeroCanvas = lazy(() =>
  import("../../scene/astronaut/JourneyCanvases.tsx").then((m) => ({ default: m.HeroCanvas })),
);

const TITLE_LINES = ["Step into a new orbit", "and let your", "silicon run wild"];

function ImmersiveJourney(): JSX.Element {
  const section = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const theme = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const cardEdge = useRef<HTMLDivElement>(null);
  const bezel = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const titleLines = useRef<(HTMLElement | null)[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const clock = useRef<JourneyClock>({ t: 0, width: 1, height: 1 });

  const els = useMemo<JourneyElements>(
    () => ({ section, stage, backdrop, theme, world, hero, cardEdge, bezel, intro, titleLines, end, clock }),
    [],
  );
  const { near, active } = useJourneyDriver(els);

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
        <div ref={end} className="aj-end">
          <JourneyEndContent />
        </div>
      </div>
    </div>
  );
}

/** Static finale for reduced motion or browsers without WebGL. */
function JourneyFallback(): JSX.Element {
  return (
    <div className="aj-fallback" aria-label="Mission launch" role="region">
      <svg className="aj-fallback-art" viewBox="0 0 1000 520" aria-hidden="true">
        <SpaceBackdrop idPrefix="fallback" />
        <AstronautFigure isWaving />
      </svg>
      <div className="aj-end aj-end-static">
        <JourneyEndContent />
      </div>
    </div>
  );
}

export function AstronautSpaceJourney(): JSX.Element {
  const enhanced = useMotionMode() === "enhanced";
  const [webgl] = useState(checkWebGL);
  return enhanced && webgl ? <ImmersiveJourney /> : <JourneyFallback />;
}
