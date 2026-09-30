import { useRef, useState, type JSX } from "react";
import { SiliconFleetCanvas } from "../../scene/journey/SiliconFleetCanvas.tsx";
import { boardLifecycle } from "../../content/board-lifecycle.ts";
import { useMotionMode } from "../../motion/use-motion-mode.ts";
import { clamp01, useScrollFrame } from "../../motion/scroll-frame.ts";
import { LusionKineticHeading } from "../ui/LusionKineticHeading.tsx";
import "../../styles/board-lifecycle.css";

export function StoryJourney(): JSX.Element {
  const section = useRef<HTMLElement>(null);
  const enhanced = useMotionMode() === "enhanced";
  const [progress, setProgress] = useState(0);
  useScrollFrame(() => {
    const el = section.current;
    if (el) setProgress(clamp01(-el.getBoundingClientRect().top / Math.max(1, el.offsetHeight - innerHeight)));
  }, enhanced);
  const index = Math.min(boardLifecycle.length - 1, Math.floor(progress * boardLifecycle.length));
  const stage = boardLifecycle[index];
  const jump = (target: number) => {
    const el = section.current;
    if (!el) return;
    window.scrollTo({ top: scrollY + el.getBoundingClientRect().top + (el.offsetHeight - innerHeight) * (target + .15) / boardLifecycle.length, behavior: "instant" });
  };
  return <section ref={section} className={`board-lifecycle${enhanced ? " is-animated" : ""}`} id="journey" aria-label="Systems journey" data-lifecycle-stage={stage.id} style={enhanced ? { height: `${boardLifecycle.length * 110 + 100}vh` } : undefined}>
    <div className="board-lifecycle-stage">
      <div className="board-lifecycle-header"><LusionKineticHeading text="Silicon to Fleet." subtitle="From bare silicon and power rails, through flash, bootloader, kernel, and userspace, to applications and a fleet under full control." />
        <p className="board-lifecycle-note">Engineering workflow illustration · not live device telemetry</p></div>
      {enhanced ? <>
        <nav className="board-lifecycle-nav" aria-label="Board lifecycle stages">{boardLifecycle.map((item, i) => <button key={item.id} type="button" onClick={() => jump(i)} aria-current={index === i ? "step" : undefined}><span>{String(i + 1).padStart(2, "0")}</span>{item.label}</button>)}</nav>
        <div className="board-lifecycle-body">
          <article className="board-lifecycle-copy"><span className="board-lifecycle-label">{stage.label}</span><h3>{stage.title}</h3><p>{stage.description}</p><ul>{stage.evidence.map((item) => <li key={item}>{item}</li>)}</ul><code>{stage.signal}</code></article>
          <div className="board-lifecycle-canvas" aria-hidden="true"><SiliconFleetCanvas currentStage={index} /></div>
        </div>
        <div className="board-lifecycle-progress" aria-hidden="true"><span style={{ width: `${progress * 100}%` }} /></div>
      </> : <ol className="board-lifecycle-static">{boardLifecycle.map((item) => <li key={item.id}><span className="board-lifecycle-label">{item.label}</span><h3>{item.title}</h3><p>{item.description}</p><code>{item.signal}</code></li>)}</ol>}
    </div>
  </section>;
}
