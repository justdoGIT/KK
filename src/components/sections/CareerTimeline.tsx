import { lazy, Suspense, useMemo, useRef, useState, type JSX } from "react";
import { career } from "../../content/career.ts";
import { CAREER_STAGE_META, CAREER_VIEWPORTS } from "../../scene/career/career-timeline.ts";
import { createCareerClock, type CareerClock } from "../../scene/career/career-clock.ts";
import { checkWebGL } from "../../scene/useCapability.ts";
import { CareerEntryList } from "./career/CareerEntryList.tsx";
import { useCareerDriver } from "./career/useCareerDriver.ts";
import { WallFollowerHud, type HudRefs } from "./career/WallFollowerHud.tsx";

const CareerJourneyCanvas = lazy(() =>
  import("../../scene/career/CareerJourneyCanvas.tsx").then((m) => ({ default: m.CareerJourneyCanvas })),
);

/** Journey order is oldest role first; content is stored newest first. */
const JOURNEY_ENTRIES = CAREER_STAGE_META.map((meta) => {
  const entry = career.find((item) => item.id === meta.entryId);
  if (!entry) throw new Error(`career entry ${meta.entryId} missing`);
  return entry;
});

function prefersStatic(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches || !checkWebGL();
}

export function CareerTimeline(): JSX.Element {
  const [isStatic] = useState(prefersStatic);
  const section = useRef<HTMLElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const clock = useRef<CareerClock>(createCareerClock());
  const depth = useRef<HTMLCanvasElement>(null);
  const correction = useRef<HTMLCanvasElement>(null);
  const top = useRef<HTMLCanvasElement>(null);
  const mode = useRef<HTMLSpanElement>(null);
  const left = useRef<HTMLSpanElement>(null);
  const right = useRef<HTMLSpanElement>(null);
  const hud = useMemo<HudRefs>(() => ({ depth, correction, top, mode, left, right }), []);
  const elements = useMemo(() => ({ section, flash, clock, hud }), [hud]);
  const { near, active, stage } = useCareerDriver(elements, !isStatic);
  const [override, setOverride] = useState<{ stage: number; id: string | null } | null>(null);

  const meta = CAREER_STAGE_META[stage];
  const openId = override && override.stage === stage ? override.id : meta.entryId;

  return (
    <section
      ref={section}
      aria-label="Career timeline"
      id="career"
      className={`career-journey${isStatic ? " career-journey--static" : ""}`}
      style={isStatic ? undefined : { height: `${CAREER_VIEWPORTS * 100}vh` }}
    >
      <div className="career-sticky">
        <div className="career-column">
          <div className="career-header">
            <p className="career-eyebrow">Career · robotics evolution</p>
            <h2>Career &amp; Systems Evolution</h2>
            <p className="section-subtitle">
              Nine years of embedded Linux, RTOS, and edge AI engineering, told as one robot that keeps rebuilding
              itself: wall follower, rover, quadruped, humanoid, supercar.
            </p>
          </div>
          <CareerEntryList
            entries={JOURNEY_ENTRIES}
            activeId={meta.entryId}
            openId={openId}
            clock={clock}
            onOpenChange={(id, open) => setOverride({ stage, id: open ? id : null })}
          />
        </div>

        {!isStatic && (
          <div className="career-screen" aria-hidden="true">
            <div className="career-screen-inner">
              {near && (
                <Suspense fallback={null}>
                  <CareerJourneyCanvas clock={clock} active={active} />
                </Suspense>
              )}
              <div className="career-screen-caption">
                <span className="career-screen-codename">{meta.codename}</span>
                <span className="career-screen-robot">{meta.robot}</span>
                <span className="career-screen-text">{meta.caption}</span>
              </div>
              <WallFollowerHud
                visible={stage === 0}
                depthRef={depth}
                correctionRef={correction}
                topRef={top}
                modeRef={mode}
                leftRef={left}
                rightRef={right}
              />
              <div ref={flash} className="career-screen-flash" />
            </div>
          </div>
        )}

        {!isStatic && (
          <ol className="career-rail" aria-hidden="true">
            {JOURNEY_ENTRIES.map((entry, index) => (
              <li key={entry.id} className={index === stage ? "is-active" : index < stage ? "is-done" : undefined}>
                <span>{String(index + 1).padStart(2, "0")}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
