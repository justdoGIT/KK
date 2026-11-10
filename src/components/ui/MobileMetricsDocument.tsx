import { useLayoutEffect, useRef } from "react";
import { useMotionMode } from "../../motion/use-motion-mode.ts";
import { clamp01, useScrollFrame } from "../../motion/scroll-frame.ts";
import { documentTimeline } from "../../motion/metrics-document.ts";
import type { MetricItem } from "./ClientMetricsStrip.tsx";
import "../../styles/metrics-document.css";

export function MobileMetricsDocument({ items }: { items: readonly MetricItem[] }) {
  const animated = useMotionMode() === "enhanced";
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const rollRef = useRef<HTMLDivElement>(null);
  const frame = useRef(documentTimeline(0, 0, 0));

  useScrollFrame(
    () => {
      const section = sectionRef.current;
      const stage = stageRef.current;
      const document = documentRef.current;
      const paper = paperRef.current;
      if (!section || !stage || !document || !paper) return;
      const pinTop = parseFloat(getComputedStyle(stage).top) || 0;
      const travel = section.offsetHeight - stage.offsetHeight;
      const progress = clamp01((pinTop - section.getBoundingClientRect().top) / Math.max(1, travel));
      frame.current = documentTimeline(progress, paper.offsetHeight, stage.clientHeight - document.offsetTop - 24);
    },
    () => {
      const document = documentRef.current;
      const paper = paperRef.current;
      const roll = rollRef.current;
      if (!document || !paper || !roll) return;
      const { opening, cut, rollTop, rollHeight, shift } = frame.current;
      stageRef.current?.style.setProperty("--document-guide-opacity", String(1 - Math.min(1, opening * 2)));
      document.dataset.unroll = opening >= 1 ? "open" : opening <= 0 ? "closed" : "unrolling";
      document.style.transform = shift > 0 ? `translate3d(0, ${-shift}px, 0)` : "none";
      paper.style.clipPath = opening >= 1 ? "none" : `inset(0 0 ${cut}px 0)`;
      roll.style.transform = `translate3d(0, ${rollTop}px, 0)`;
      roll.style.height = `${rollHeight}px`;
      roll.style.setProperty("--roll-label-opacity", String(1 - Math.min(1, opening * 8)));
    },
    animated,
  );

  // A live reduced-motion preference restores a fully readable, flowing page.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const document = documentRef.current;
    const paper = paperRef.current;
    const roll = rollRef.current;
    return () => {
      stage?.style.removeProperty("--document-guide-opacity");
      document?.removeAttribute("style");
      paper?.removeAttribute("style");
      roll?.removeAttribute("style");
    };
  }, [animated]);

  return (
    <div ref={sectionRef} className={`client-metrics-strip metrics-document-section${animated ? " metrics-document-animated" : ""}`} aria-label="Key engineering metrics">
      <div ref={stageRef} className="metrics-document-stage">
        <div className="metrics-document-guide" aria-hidden="true">
          <span>EXPERIENCE & IMPACT</span>
          {animated && <span>SCROLL TO UNROLL ↓</span>}
        </div>
        <div ref={documentRef} className="metrics-document" data-unroll={animated ? "closed" : "open"}>
          <div ref={paperRef} className="metrics-document-paper">
            <header className="metrics-document-heading">
              <span>KAMAL PANDEY / ENGINEERING</span>
              <h2>A record of real-world impact.</h2>
              <div className="metrics-document-rule" aria-hidden="true" />
            </header>
            <dl className="metrics-document-list">
              {items.map((item) => (
                <div key={item.value} className="metrics-document-metric">
                  <dt className="metrics-document-label">{item.label}</dt>
                  <dd className="metrics-document-value">{item.value}</dd>
                  <dd className="metrics-document-subtext">{item.subtext}</dd>
                </div>
              ))}
            </dl>
            <div className="metrics-document-signoff" aria-hidden="true">
              <span>EMBEDDED SYSTEMS / BUILT TO LAST</span><span>01 — 01</span>
            </div>
          </div>
          {animated && <div ref={rollRef} className="metrics-document-roll" aria-hidden="true"><span>ENGINEERING RECORD</span></div>}
        </div>
      </div>
    </div>
  );
}
