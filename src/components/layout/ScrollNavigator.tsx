import { useEffect, useState } from "react";
import { pageJourneyStops } from "./page-journey-stops.ts";

export function ScrollNavigator() {
  const [active, setActive] = useState<string>(pageJourneyStops[0].id);

  useEffect(() => {
    const sections = pageJourneyStops
      .map((stop) => document.getElementById(stop.id))
      .filter((section): section is HTMLElement => section !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target instanceof HTMLElement) setActive(visible.target.id);
      },
      { threshold: [0.2, 0.55], rootMargin: "-18% 0px -48%" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const activeIndex = pageJourneyStops.findIndex((stop) => stop.id === active);
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
              <span>{String(index + 1).padStart(2, "0")}</span>
              <b>{stop.label}</b>
            </a>
          </li>
        ))}
      </ol>
      <a className="scroll-next" href={`#${next.id}`}>
        <span>Next</span>
        <strong aria-hidden="true">↓</strong>
      </a>
    </aside>
  );
}
