import { useRef, useState, type JSX } from "react";
import { SiliconFleetCanvas } from "../../scene/journey/SiliconFleetCanvas.tsx";
import { boardLifecycle } from "../../content/board-lifecycle.ts";
import { useMotionMode } from "../../motion/use-motion-mode.ts";
import { useMediaQuery } from "../../motion/use-media-query.ts";
import { useGuidedScroll } from "../../motion/guided-scroll.ts";
import { scrollToY } from "../../motion/smooth-scroll.ts";
import { clamp01, useScrollFrame } from "../../motion/scroll-frame.ts";
import { LusionKineticHeading } from "../ui/LusionKineticHeading.tsx";
import { MOBILE_BOARD_QUERY, MobileBoardCarousel } from "../ui/MobileBoardCarousel.tsx";
import "../../styles/board-lifecycle.css";

export function StoryJourney(): JSX.Element {
  const section = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const enhanced = useMotionMode() === "enhanced";
  const mobile = useMediaQuery(MOBILE_BOARD_QUERY);
  const roomy = useMediaQuery("(min-width: 1024px) and (min-height: 720px)");
  const animated = enhanced && roomy && !mobile;
  useGuidedScroll(section, animated, { target: 0.94, seconds: 18 });
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const progressRef = useRef(0);
  useScrollFrame(
    () => {
      const el = section.current;
      if (!el) return;
      progressRef.current = clamp01(-el.getBoundingClientRect().top / Math.max(1, el.offsetHeight - innerHeight));
    },
    () => {
      if (barRef.current) barRef.current.style.transform = `scaleX(${progressRef.current})`;
      const i = Math.min(boardLifecycle.length - 1, Math.floor(progressRef.current * boardLifecycle.length));
      if (i !== indexRef.current) {
        indexRef.current = i;
        setIndex(i);
      }
    },
    animated,
  );
  const stage = boardLifecycle[index];
  const jump = (target: number) => {
    const el = section.current;
    if (!el) return;
    scrollToY(scrollY + el.getBoundingClientRect().top + (el.offsetHeight - innerHeight) * (target + .15) / boardLifecycle.length, { immediate: true });
  };
  if (mobile) {
    return (
      <section ref={section} className="board-lifecycle mobile-board-section" id="journey" aria-label="Systems journey" data-lifecycle-stage={stage.id}>
        <div className="board-lifecycle-header">
          <LusionKineticHeading text="Silicon to Fleet." />
          <p className="board-lifecycle-note">Engineering workflow illustration · not live device telemetry</p>
        </div>
        {enhanced && <div className="mobile-board-scene" aria-hidden="true"><SiliconFleetCanvas currentStage={index} /></div>}
        <MobileBoardCarousel label="Board lifecycle stages" onIndexChange={setIndex}>
          {boardLifecycle.map((item) => (
            <article key={item.id} className="board-lifecycle-copy">
              <span className="board-lifecycle-label">{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <ul>{item.evidence.map((evidence) => <li key={evidence}>{evidence}</li>)}</ul>
              <code>{item.signal}</code>
            </article>
          ))}
        </MobileBoardCarousel>
      </section>
    );
  }
  return <section ref={section} className={`board-lifecycle${animated ? " is-animated" : ""}`} id="journey" aria-label="Systems journey" data-lifecycle-stage={stage.id} style={animated ? { height: `${boardLifecycle.length * 110 + 100}vh` } : undefined}>
    <div className="board-lifecycle-stage">
      <div className="board-lifecycle-header"><LusionKineticHeading text="Silicon to Fleet." subtitle="From bare silicon and power rails, through flash, bootloader, kernel, and userspace, to applications and a fleet under full control." />
        <p className="board-lifecycle-note">Engineering workflow illustration · not live device telemetry</p></div>
      {animated ? <>
        <nav className="board-lifecycle-nav" aria-label="Board lifecycle stages">{boardLifecycle.map((item, i) => <button key={item.id} type="button" onClick={() => jump(i)} aria-current={index === i ? "step" : undefined}><span>{String(i + 1).padStart(2, "0")}</span>{item.label}</button>)}</nav>
        <div className="board-lifecycle-body">
          <article className="board-lifecycle-copy"><span className="board-lifecycle-label">{stage.label}</span><h3>{stage.title}</h3><p>{stage.description}</p><ul>{stage.evidence.map((item) => <li key={item}>{item}</li>)}</ul><code>{stage.signal}</code></article>
          <div className="board-lifecycle-canvas" aria-hidden="true"><SiliconFleetCanvas currentStage={index} /></div>
        </div>
        <div className="board-lifecycle-progress" aria-hidden="true"><span ref={barRef} style={{ transform: "scaleX(0)" }} /></div>
      </> : <ol className="board-lifecycle-static">{boardLifecycle.map((item) => <li key={item.id}><span className="board-lifecycle-label">{item.label}</span><h3>{item.title}</h3><p>{item.description}</p><ul>{item.evidence.map((evidence) => <li key={evidence}>{evidence}</li>)}</ul><code>{item.signal}</code></li>)}</ol>}
    </div>
  </section>;
}
