import { useEffect, useRef, type JSX } from "react";
import type { CareerClockRef } from "../../../scene/career/career-clock.ts";
import { smoothstep } from "../../../scene/career/career-timeline.ts";
import type { CareerEntry } from "../../../content/career.ts";
import { Disclosure } from "../../ui/Disclosure.tsx";

type CareerEntryListProps = {
  /** Entries in journey order (oldest first). */
  entries: readonly CareerEntry[];
  activeId: string;
  openId: string | null;
  clock: CareerClockRef;
  animated: boolean;
  onOpenChange: (id: string, open: boolean) => void;
};

/** Left column: every role stays in the DOM; the active role scrolls into the viewport and expands. */
export function CareerEntryList({ entries, activeId, openId, clock, animated, onOpenChange }: CareerEntryListProps): JSX.Element {
  const listRef = useRef<HTMLOListElement>(null);
  const activeRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!animated) return;
    let frame = 0;
    const scrub = () => {
      frame = requestAnimationFrame(scrub);
      const list = listRef.current;
      const active = activeRef.current;
      if (!list || !active) return;
      const itemTop = active.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
      const viewport = list.clientHeight;
      const overflow = Math.max(0, active.offsetHeight - viewport + 16);
      const target =
        overflow > 0
          ? itemTop - 8 + overflow * smoothstep(0.15, 0.92, clock.current.local)
          : itemTop - (viewport - active.offsetHeight) * 0.5;
      list.scrollTop += (Math.max(0, target) - list.scrollTop) * 0.14;
    };
    frame = requestAnimationFrame(scrub);
    return () => cancelAnimationFrame(frame);
  }, [activeId, clock, animated]);

  return (
    <ol ref={listRef} className="career-entries">
      {entries.map((entry, index) => (
        <li
          ref={entry.id === activeId ? activeRef : undefined}
          key={entry.id}
          className={`career-entry${entry.id === activeId ? " is-active" : ""}`}
        >
          <span className="career-entry-index" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <Disclosure
            id={entry.id}
            open={openId === entry.id}
            onOpenChange={(open) => onOpenChange(entry.id, open)}
            summary={
              <span className="timeline-summary">
                <span className="timeline-period">{entry.period}</span>
                <span className="timeline-role-org">
                  <span className="timeline-title">{entry.title}</span>
                  <span className="timeline-sep" aria-hidden="true">
                    •
                  </span>
                  <span className="timeline-org">{entry.organization}</span>
                </span>
              </span>
            }
          >
            <div className="timeline-detail">
              <p className="timeline-desc">{entry.summary}</p>
              <h4>Projects &amp; contributions</h4>
              <ul className="timeline-list">
                {entry.accomplishments.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <ul className="tag-list" aria-label={`${entry.organization} technologies`}>
                {entry.technologies.map((tech) => (
                  <li key={tech} className="tag">
                    {tech}
                  </li>
                ))}
              </ul>
            </div>
          </Disclosure>
        </li>
      ))}
    </ol>
  );
}
