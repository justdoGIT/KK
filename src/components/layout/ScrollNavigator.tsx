import { useRef, useState } from "react";
import { useScrollFrame } from "../../motion/scroll-frame.ts";
import { pageJourneyStops } from "./page-journey-stops.ts";

// A stop is current once its top passes this fraction of the viewport. Scroll
// position (not IntersectionObserver ratios) keeps multi-viewport pinned
// sections current for their whole length.
const ACTIVE_LINE = 0.4;

export function ScrollNavigator() {
  const [active, setActive] = useState<string>(pageJourneyStops[0].id);
  const currentRef = useRef(active);

  useScrollFrame(
    () => {
      const line = window.innerHeight * ACTIVE_LINE;
      let current: string = pageJourneyStops[0].id;
      for (const stop of pageJourneyStops) {
        const section = document.getElementById(stop.id);
        if (section && section.getBoundingClientRect().top <= line) current = stop.id;
      }
      currentRef.current = current;
    },
    () => {
      if (active !== currentRef.current) setActive(currentRef.current);
    },
  );

  const activeIndex = pageJourneyStops.findIndex((stop) => stop.id === active);
  const isLastStop = activeIndex >= pageJourneyStops.length - 1;
  const next = pageJourneyStops[Math.min(activeIndex + 1, pageJourneyStops.length - 1)];

  return (
    <aside className="scroll-navigator" aria-label="Page journey">
      <div className="scroll-navigator-track" aria-hidden="true">
        <span style={{ height: `${((activeIndex + 1) / pageJourneyStops.length) * 100}%` }} />
      </div>
      <ol>
        {pageJourneyStops.map((stop, index) => (
          <li key={stop.id} className={stop.id === active ? "scroll-stop-active" : ""}>
            <a href={`#${stop.id}`} aria-label={`Go to ${stop.label}`} aria-current={stop.id === active ? "step" : undefined}>
              <b>{stop.label}</b>
              <span>{String(index + 1).padStart(2, "0")}</span>
            </a>
          </li>
        ))}
      </ol>
      {!isLastStop && (
        <a className="scroll-next" href={`#${next.id}`}>
          <span>Next</span>
          <strong aria-hidden="true">↓</strong>
        </a>
      )}
    </aside>
  );
}
