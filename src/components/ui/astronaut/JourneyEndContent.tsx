import { type JSX } from "react";
import { contactInfo } from "../../../content/contact.ts";

const CROSSES = [
  { x: 20, y: 18 },
  { x: 80, y: 18 },
  { x: 20, y: 79 },
  { x: 50, y: 79 },
  { x: 80, y: 79 },
];

/** Finale copy + calls to action layered over the waving astronaut. */
export function JourneyEndContent(): JSX.Element {
  return (
    <>
      {CROSSES.map((cross) => (
        <span
          key={`${cross.x}-${cross.y}`}
          className="aj-cross"
          style={{ left: `${cross.x}%`, top: `${cross.y}%` }}
          aria-hidden="true"
        />
      ))}
      <p className="aj-end-kicker">Is your next embedded product ready for launch?</p>
      <p className="aj-end-title">
        <span>Let&rsquo;s build it</span>
        <span>together!</span>
      </p>
      <div className="aj-end-actions">
        <a className="aj-pill" href={`mailto:${contactInfo.email}?subject=Mission%20Launch%20Inquiry`}>
          Start a conversation <span aria-hidden="true">↗</span>
        </a>
        <a className="aj-pill aj-pill-ghost" href={contactInfo.github} target="_blank" rel="noreferrer">
          Explore repositories <span aria-hidden="true">↗</span>
        </a>
      </div>
    </>
  );
}
